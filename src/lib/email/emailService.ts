import {
  welcomeEmail,
  ticketConfirmationEmail,
  ritualReminderEmail,
  archetypeRevealEmail,
} from "./templates";
import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, html },
    });

    if (error) {
      console.error("[Email] Send failed:", error.message);
    }
  } catch (err) {
    console.error("[Email] Send error:", err);
  }
}

export async function sendWelcomeEmail(
  to: string,
  displayName: string,
  archetypeName: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Welcome to Money Spirit, ${displayName}`,
    html: welcomeEmail(displayName, archetypeName),
  });
}

export async function sendTicketConfirmation(
  to: string,
  displayName: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string,
  ticketId: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Your ticket for ${eventTitle} is confirmed`,
    html: ticketConfirmationEmail(displayName, eventTitle, eventDate, eventLocation, ticketId),
  });
}

export async function sendRitualReminder(
  to: string,
  displayName: string,
  ritualTitle: string,
  ritualPrompt: string
): Promise<void> {
  await sendEmail({
    to,
    subject: "Your weekly Money Spirit ritual is ready",
    html: ritualReminderEmail(displayName, ritualTitle, ritualPrompt),
  });
}

export async function sendArchetypeReveal(
  to: string,
  displayName: string,
  archetypeName: string,
  archetypeDescription: string,
  accentColour: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `You are ${archetypeName} — your Money Spirit journey begins`,
    html: archetypeRevealEmail(displayName, archetypeName, archetypeDescription, accentColour),
  });
}
