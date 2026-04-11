import {
  welcomeEmail,
  ticketConfirmationEmail,
  ritualReminderEmail,
  archetypeRevealEmail,
} from "./templates";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  try {
    const apiKey = import.meta.env.VITE_RESEND_API_KEY;
    if (!apiKey || apiKey === "re_placeholder_replace_with_real_key") {
      console.warn("[Email] Resend API key not configured — skipping send to", to);
      return;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Money Spirit <hello@moneyspirit.com.au>",
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      console.error("[Email] Send failed:", await response.text());
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
