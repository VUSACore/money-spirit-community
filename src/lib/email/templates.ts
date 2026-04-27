const headerHtml = `
<div style="text-align:center;padding-bottom:32px;">
  <div style="font-family:Georgia,serif;font-size:32px;color:#F5C842;letter-spacing:2px;">Money Spirit</div>
  <div style="font-family:Georgia,serif;font-style:italic;font-size:16px;color:#C9941E;margin-top:4px;">Spirit Inspired Freedom</div>
  <hr style="border:none;border-top:1px solid rgba(201,148,30,0.3);margin-top:24px;" />
</div>`;

const footerHtml = `
<hr style="border:none;border-top:1px solid rgba(248,220,138,0.44);margin-top:32px;" />
<div style="padding-top:20px;">
  <p style="font-family:Arial,sans-serif;font-size:12px;color:#6E94C8;line-height:1.6;margin:0 0 8px;">
    Money Spirit provides financial education only — not financial advice.
    <a href="https://moneyspirit.com.au/ethics" style="color:#C9941E;text-decoration:underline;">Read our Ethics Commitment</a>
  </p>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#4B78B8;line-height:1.5;margin:0 0 8px;">
    You received this because you joined Money Spirit. To unsubscribe, visit your account settings.
  </p>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#4B78B8;text-align:center;margin:16px 0 0;">
    &copy; 2026 Money Spirit. All rights reserved.
  </p>
</div>`;

const wrap = (body: string) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#061530;">
<div style="background:#061530;padding:40px 0;">
<div style="max-width:600px;margin:0 auto;background:#0A2044;border-radius:16px;padding:40px;font-family:Arial,sans-serif;">
${headerHtml}
${body}
${footerHtml}
</div></div></body></html>`;

const ctaButton = (text: string, href: string, bgStart = "#F5C842") =>
  `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="background:linear-gradient(135deg,${bgStart},#C9941E);color:#061530;padding:14px 32px;border-radius:8px;font-family:Arial,sans-serif;font-weight:bold;font-size:15px;text-decoration:none;display:inline-block;">${text}</a>
  </div>`;

export function welcomeEmail(displayName: string, archetypeName: string): string {
  return wrap(`
    <h1 style="font-family:Georgia,serif;font-size:24px;color:#F8F5EF;margin:0 0 8px;">Welcome to Money Spirit, ${displayName}</h1>
    <p style="font-family:Georgia,serif;font-style:italic;font-size:18px;color:#C9941E;margin:0 0 20px;">You are ${archetypeName}</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#C5D5EC;line-height:1.7;margin:0 0 16px;">
      You have taken the first step on a powerful journey toward financial wellbeing. Money Spirit is your community, your guide, and your sacred space to grow.
    </p>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#C5D5EC;line-height:1.7;margin:0 0 16px;">
      Your archetype — ${archetypeName} — has been revealed. Head to your dashboard to discover your personalised pathway and complete your first money ritual.
    </p>
    ${ctaButton("Enter Your Dashboard", "https://moneyspirit.com.au/dashboard")}
  `);
}

export function ticketConfirmationEmail(
  displayName: string, eventTitle: string, eventDate: string,
  eventLocation: string, ticketId: string
): string {
  const shortId = ticketId.substring(0, 8).toUpperCase();
  return wrap(`
    <h1 style="font-family:Georgia,serif;font-size:24px;color:#F8F5EF;margin:0 0 8px;">Your ticket is confirmed!</h1>
    <p style="font-family:Georgia,serif;font-style:italic;font-size:20px;color:#C9941E;margin:0 0 20px;">${eventTitle}</p>
    <div style="background:#061530;border-radius:8px;padding:20px;margin:20px 0;border-left:3px solid #C9941E;">
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#C5D5EC;margin:0 0 8px;">● ${eventDate}</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#C5D5EC;margin:0 0 8px;">● ${eventLocation}</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#C5D5EC;margin:0;">● Ticket #${shortId}</p>
    </div>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#C5D5EC;line-height:1.7;margin:0 0 16px;">
      Your virtual link will be available in the platform after you complete the recording consent process. We cannot wait to see you there.
    </p>
    ${ctaButton("View My Ticket", "https://moneyspirit.com.au/events")}
  `);
}

export function ritualReminderEmail(
  displayName: string, ritualTitle: string, ritualPrompt: string
): string {
  return wrap(`
    <h1 style="font-family:Georgia,serif;font-size:24px;color:#F8F5EF;margin:0 0 20px;">Your weekly ritual is ready</h1>
    <div style="background:#061530;border-radius:8px;padding:24px;margin:20px 0;border:1px solid rgba(201,148,30,0.3);text-align:center;">
      <div style="color:#C9941E;font-size:24px;margin-bottom:12px;">✦</div>
      <p style="font-family:Georgia,serif;font-size:20px;color:#F5C842;margin:0 0 12px;">${ritualTitle}</p>
      <p style="font-family:Georgia,serif;font-style:italic;font-size:15px;color:#9DB8DC;line-height:1.7;margin:0;">${ritualPrompt}</p>
    </div>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#C5D5EC;line-height:1.7;margin:0 0 16px;">
      Take a moment this week to complete your ritual. Every small practice builds the foundation for lasting financial wellbeing.
    </p>
    ${ctaButton("Complete My Ritual", "https://moneyspirit.com.au/rituals")}
  `);
}

export function archetypeRevealEmail(
  displayName: string, archetypeName: string,
  archetypeDescription: string, accentColour: string
): string {
  return wrap(`
    <h1 style="font-family:Georgia,serif;font-size:24px;color:#F8F5EF;margin:0 0 20px;">Your archetype has been revealed</h1>
    <div style="background:#061530;border-radius:12px;padding:32px;margin:20px 0;border:2px solid ${accentColour};text-align:center;">
      <p style="font-family:Georgia,serif;font-size:14px;color:#9DB8DC;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">You are</p>
      <p style="font-family:Georgia,serif;font-size:36px;color:${accentColour};font-style:italic;margin:0 0 16px;">${archetypeName}</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#C5D5EC;line-height:1.7;margin:0;">${archetypeDescription}</p>
    </div>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#C5D5EC;line-height:1.7;margin:0 0 16px;">
      Your archetype is the lens through which Money Spirit will personalise your journey. Head to your dashboard to discover your pathway, your first ritual, and your next sacred step.
    </p>
    ${ctaButton("Begin My Journey", "https://moneyspirit.com.au/dashboard", accentColour)}
  `);
}
