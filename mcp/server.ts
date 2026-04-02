/**
 * AiBooker MCP Server
 *
 * Enterprise-grade Model Context Protocol server that exposes AiBooker's
 * booking capabilities as standardized tools for AI platforms.
 *
 * Architecture:
 *   AI Client (Claude/ChatGPT/Gemini)
 *     → MCP Protocol (JSON-RPC over HTTP)
 *       → AiBooker MCP Server (this file)
 *         → AiBooker Database (Drizzle/PostgreSQL)
 *
 * Transport: Streamable HTTP at /mcp
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';

import { searchProviders, getProviderAvailability, createBookingWithHold, getBookingStatus, expireHeldBookings } from '../lib/ai/queries.js';

dotenv.config();

const PORT = parseInt(process.env.MCP_PORT || '3001');
const SERVER_NAME = 'AiBooker MCP Server';
const SERVER_VERSION = '1.0.0';

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

// --------------------------------------------------------------------------
// Tool: search_providers
// --------------------------------------------------------------------------

server.tool(
  'search_providers',
  'Search for restaurants, salons, or activities by city, cuisine, date, time, and party size. Returns matching providers with real-time availability.',
  {
    city: z.string().optional().describe('City name (e.g., "Amsterdam", "London")'),
    cuisine: z.string().optional().describe('Cuisine or business type (e.g., "italian", "salon")'),
    date: z.string().optional().describe('Date in YYYY-MM-DD format'),
    time: z.string().optional().describe('Preferred time in HH:MM format'),
    party_size: z.number().optional().describe('Number of guests (1-50)'),
    query: z.string().optional().describe('Free text search (e.g., "romantic terrace dinner")'),
  },
  async (args) => {
    try {
      const results = await searchProviders({
        city: args.city,
        cuisine: args.cuisine,
        date: args.date,
        time: args.time,
        partySize: args.party_size,
        query: args.query,
        limit: 10,
      });

      const formatted = results.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        cuisine_type: r.cuisineType,
        tags: r.tags,
        price_range: r.priceRange,
        rating: r.rating,
        city: r.city,
        has_availability: r.hasAvailability,
        available_slots: (r.availableSlots || []).map((s: any) => ({
          time: s.startTime,
          booking_type: s.bookingTypeName,
          booking_type_id: s.bookingTypeId,
        })),
      }));

      return {
        content: [{
          type: 'text' as const,
          text: formatted.length > 0
            ? `Found ${formatted.length} result(s):\n\n${JSON.stringify(formatted, null, 2)}`
            : 'No results found. Try broadening your search criteria.',
        }],
      };
    } catch (error: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// --------------------------------------------------------------------------
// Tool: check_availability
// --------------------------------------------------------------------------

server.tool(
  'check_availability',
  'Check real-time availability for a specific restaurant or business. Returns available time slots and alternatives.',
  {
    provider_id: z.number().describe('Provider ID from search results'),
    date: z.string().describe('Date in YYYY-MM-DD format'),
    time: z.string().optional().describe('Preferred time in HH:MM format'),
    party_size: z.number().optional().describe('Number of guests'),
  },
  async (args) => {
    try {
      const availability = await getProviderAvailability(args.provider_id, args.date, args.time, args.party_size);

      const result = {
        provider_id: args.provider_id,
        date: args.date,
        available: availability.slots.length > 0,
        slots: availability.slots.map((s: any) => ({
          time: s.startTime,
          end_time: s.endTime,
          booking_type_id: s.bookingTypeId,
          booking_type: s.bookingTypeName,
          remaining_capacity: s.remainingCapacity,
        })),
        alternative_times: availability.alternatives,
        hold_duration_seconds: 300,
      };

      return {
        content: [{
          type: 'text' as const,
          text: result.available
            ? `Available! ${result.slots.length} slot(s):\n\n${JSON.stringify(result, null, 2)}`
            : `Not available.${result.alternative_times.length > 0 ? ` Alternatives: ${result.alternative_times.join(', ')}` : ''}`,
        }],
      };
    } catch (error: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// --------------------------------------------------------------------------
// Tool: create_booking
// --------------------------------------------------------------------------

server.tool(
  'create_booking',
  'Create a booking at a restaurant or business. The slot is held for 300 seconds (5 minutes). Payment and confirmation are handled by the booking partner.',
  {
    provider_id: z.number().describe('Provider ID'),
    booking_type_id: z.number().describe('Booking type ID from availability check'),
    date: z.string().describe('Date in YYYY-MM-DD format'),
    time: z.string().describe('Time in HH:MM format'),
    party_size: z.number().describe('Number of guests'),
    first_name: z.string().describe('Customer first name'),
    last_name: z.string().describe('Customer last name'),
    email: z.string().describe('Customer email address'),
    phone: z.string().optional().describe('Customer phone number'),
    special_requests: z.string().optional().describe('Special requests'),
  },
  async (args) => {
    try {
      const availability = await getProviderAvailability(args.provider_id, args.date, args.time, args.party_size);

      if (availability.slots.length === 0) {
        const alt = availability.alternatives.length > 0 ? `\nAlternatives: ${availability.alternatives.join(', ')}` : '';
        return { content: [{ type: 'text' as const, text: `No availability for ${args.time} on ${args.date}.${alt}` }], isError: true };
      }

      const result = await createBookingWithHold({
        providerId: args.provider_id,
        bookingTypeId: args.booking_type_id,
        date: args.date,
        time: args.time,
        partySize: args.party_size,
        customer: {
          firstName: args.first_name,
          lastName: args.last_name,
          email: args.email,
          phone: args.phone,
        },
        aiPlatform: 'mcp',
        specialRequests: args.special_requests,
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Booking created!\n\nBooking ID: ${result.bookingId}\nStatus: ${result.status}\nHeld until: ${result.holdExpiresAt}\n\nThe slot is reserved for 5 minutes. The restaurant's booking system handles payment and confirmation.`,
        }],
      };
    } catch (error: any) {
      return { content: [{ type: 'text' as const, text: `Booking error: ${error.message}` }], isError: true };
    }
  }
);

// --------------------------------------------------------------------------
// Tool: get_booking_status
// --------------------------------------------------------------------------

server.tool(
  'get_booking_status',
  'Check the current status of a booking by its ID.',
  {
    booking_id: z.number().describe('Booking ID'),
  },
  async (args) => {
    try {
      const booking = await getBookingStatus(args.booking_id);
      if (!booking) {
        return { content: [{ type: 'text' as const, text: 'Booking not found.' }], isError: true };
      }

      return {
        content: [{
          type: 'text' as const,
          text: `Booking #${booking.id}\nStatus: ${booking.status}\nRestaurant: ${booking.providerName}\nType: ${booking.bookingTypeName}\nDate: ${booking.date}\nTime: ${booking.time}\nGuests: ${booking.partySize}\nCustomer: ${booking.customerFirstName} ${booking.customerLastName} (${booking.customerEmail})` +
            (booking.holdExpiresAt ? `\nHold expires: ${booking.holdExpiresAt}` : '') +
            (booking.confirmedAt ? `\nConfirmed: ${booking.confirmedAt}` : '') +
            (booking.cancelledAt ? `\nCancelled: ${booking.cancelledAt}` : ''),
        }],
      };
    } catch (error: any) {
      return { content: [{ type: 'text' as const, text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// --------------------------------------------------------------------------
// Resource: Active Providers List
// --------------------------------------------------------------------------

server.resource(
  'providers-list',
  'aibooker://providers',
  {
    description: 'List of all active providers on AiBooker',
    mimeType: 'application/json',
  },
  async () => {
    const results = await searchProviders({ limit: 50 });
    return {
      contents: [{
        uri: 'aibooker://providers',
        mimeType: 'application/json',
        text: JSON.stringify(results.map((r: any) => ({
          id: r.id, name: r.name, slug: r.slug, city: r.city, cuisine_type: r.cuisineType, rating: r.rating,
        })), null, 2),
      }],
    };
  }
);

// --------------------------------------------------------------------------
// HTTP Server
// --------------------------------------------------------------------------

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', server: SERVER_NAME, version: SERVER_VERSION, timestamp: new Date().toISOString() });
});

app.post('/mcp', async (req, res) => {
  try {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP request error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/mcp', (_req, res) => {
  res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Use POST' }, id: null });
});

app.delete('/mcp', (_req, res) => {
  res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Not supported' }, id: null });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════╗
║     AiBooker MCP Server v${SERVER_VERSION}         ║
╠══════════════════════════════════════════╣
║  MCP:    http://localhost:${PORT}/mcp       ║
║  Health: http://localhost:${PORT}/health    ║
║                                          ║
║  Tools:                                  ║
║   • search_providers                     ║
║   • check_availability                   ║
║   • create_booking                       ║
║   • get_booking_status                   ║
║                                          ║
║  Resources:                              ║
║   • aibooker://providers                 ║
╚══════════════════════════════════════════╝
  `);
});

export default server;
