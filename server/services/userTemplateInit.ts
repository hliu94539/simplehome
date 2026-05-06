import { loadDefaultTemplateSeeds } from "./defaultTemplateLoader";
import type { IStorage } from "../storage";

/**
 * Creates the four default property templates and all their associated maintenance
 * tasks for a newly registered user.
 *
 * Idempotency: the caller is responsible for only calling this once per user.
 * The function does not deduplicate on its own.
 */
export async function initializeUserDefaultTemplates(
  userId: string,
  storage: IStorage,
): Promise<void> {
  const seeds = loadDefaultTemplateSeeds();

  for (const seed of seeds) {
    // 1. Create the property template record scoped to this user.
    const template = await storage.createPropertyTemplate({
      userId,
      name: seed.name,
      type: seed.type,
      description: seed.description,
      taskCount: seed.tasks.length,
    });

    // 2. Insert all tasks linked to the new template.
    for (const { task } of seed.tasks) {
      await storage.createMaintenanceTask(
        { ...task, templateId: template.id },
        userId,
      );
    }
  }
}
