import { db } from './drizzle';
import { users, teamMembers, teams, accounts, activityLogs, invitations, bookings, customerLeads, availabilitySlots, bookingTypes, openingHours, providerLocations, providers, integrations } from './schema';
import { eq, and, inArray } from 'drizzle-orm';

async function deleteUser(userId: number) {
  console.log(`Deleting user ${userId} and all related data...`);

  // Get user's teams
  const userTeams = await db.select({ teamId: teamMembers.teamId }).from(teamMembers).where(eq(teamMembers.userId, userId));
  const teamIds = userTeams.map(t => t.teamId);

  // For each team, check if this is the only member
  for (const teamId of teamIds) {
    const members = await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));

    if (members.length <= 1) {
      // This user is the only member — delete team and all its data
      console.log(`  Cleaning team ${teamId}...`);

      // Get integrations for this team
      const teamIntegrations = await db.select().from(integrations).where(eq(integrations.teamId, teamId));

      for (const integration of teamIntegrations) {
        // Get providers for this integration
        const teamProviders = await db.select().from(providers).where(eq(providers.integrationId, integration.id));

        for (const provider of teamProviders) {
          console.log(`    Deleting provider: ${provider.name}`);

          // Delete bookings for this provider
          await db.delete(bookings).where(eq(bookings.providerId, provider.id));

          // Delete availability slots via booking types
          const bts = await db.select({ id: bookingTypes.id }).from(bookingTypes).where(eq(bookingTypes.providerId, provider.id));
          for (const bt of bts) {
            await db.delete(availabilitySlots).where(eq(availabilitySlots.bookingTypeId, bt.id));
          }

          // Delete booking types
          await db.delete(bookingTypes).where(eq(bookingTypes.providerId, provider.id));

          // Delete opening hours
          await db.delete(openingHours).where(eq(openingHours.providerId, provider.id));

          // Delete provider location
          await db.delete(providerLocations).where(eq(providerLocations.providerId, provider.id));

          // Delete provider
          await db.delete(providers).where(eq(providers.id, provider.id));
        }

        // Delete integration
        await db.delete(integrations).where(eq(integrations.id, integration.id));
      }

      // Delete team-level data
      await db.delete(activityLogs).where(eq(activityLogs.teamId, teamId));
      await db.delete(invitations).where(eq(invitations.teamId, teamId));
      await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
      await db.delete(teams).where(eq(teams.id, teamId));
    } else {
      // Other members exist — just remove this user from the team
      await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    }
  }

  // Delete user's OAuth accounts
  await db.delete(accounts).where(eq(accounts.userId, userId));

  // Delete the user
  await db.delete(users).where(eq(users.id, userId));

  console.log(`User ${userId} deleted successfully`);
}

// Get user ID from command line
const userId = parseInt(process.argv[2]);
if (!userId) {
  console.log('Usage: npx tsx lib/db/delete-user.ts <user_id>');
  process.exit(1);
}

deleteUser(userId).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
