import { appUrl } from "./index";

function layout(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#e9eef6;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#0b1220;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#fcfdff;border:1px solid #cdd6e4;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:20px 24px;background:#3b46d4;color:#ffffff;font-weight:700;font-size:16px;letter-spacing:-0.02em;">DevTrack</td></tr>
        <tr><td style="padding:28px 24px;">
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #dde4ee;font-size:12px;color:#6b778c;">
          You received this because it’s important to your DevTrack account. We don’t send marketing mail.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function resetPasswordMail(opts: {
  displayName: string;
  resetUrl: string;
}) {
  const subject = "Reset your DevTrack password";
  const text = `Hi ${opts.displayName},\n\nReset your password:\n${opts.resetUrl}\n\nThis link expires in 1 hour. If you didn’t ask for this, ignore the email.\n`;
  const html = layout(
    "Reset your password",
    `<p style="margin:0 0 16px;line-height:1.55;color:#4a5568;">Hi ${escapeHtml(opts.displayName)}, use the button below to choose a new password.</p>
     <p style="margin:0 0 20px;"><a href="${opts.resetUrl}" style="display:inline-block;background:#3b46d4;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:8px;">Reset password</a></p>
     <p style="margin:0;font-size:13px;color:#6b778c;line-height:1.5;">Or paste this link:<br/><span style="word-break:break-all;">${escapeHtml(opts.resetUrl)}</span></p>
     <p style="margin:16px 0 0;font-size:13px;color:#6b778c;">Expires in 1 hour.</p>`,
  );
  return { subject, text, html };
}

export function verifyEmailMail(opts: {
  displayName: string;
  verifyUrl: string;
}) {
  const subject = "Verify your DevTrack email";
  const text = `Hi ${opts.displayName},\n\nConfirm your email to finish creating your DevTrack account:\n${opts.verifyUrl}\n\nThis link expires in 24 hours.\n`;
  const html = layout(
    "Verify your email",
    `<p style="margin:0 0 16px;line-height:1.55;color:#4a5568;">Hi ${escapeHtml(opts.displayName)}, confirm your email to activate credentials sign-in. Google/GitHub accounts skip this step.</p>
     <p style="margin:0 0 20px;"><a href="${opts.verifyUrl}" style="display:inline-block;background:#3b46d4;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:8px;">Verify email</a></p>
     <p style="margin:0;font-size:13px;color:#6b778c;line-height:1.5;">Or paste this link:<br/><span style="word-break:break-all;">${escapeHtml(opts.verifyUrl)}</span></p>
     <p style="margin:16px 0 0;font-size:13px;color:#6b778c;">Expires in 24 hours.</p>`,
  );
  return { subject, text, html };
}

export function teamAddedMail(opts: {
  displayName: string;
  teamName: string;
  teamUrl: string;
  addedBy: string;
}) {
  const subject = `You’ve been added to ${opts.teamName} on DevTrack`;
  const text = `Hi ${opts.displayName},\n\n${opts.addedBy} added you to ${opts.teamName}.\nOpen the team: ${opts.teamUrl}\n`;
  const html = layout(
    `Added to ${escapeHtml(opts.teamName)}`,
    `<p style="margin:0 0 16px;line-height:1.55;color:#4a5568;">Hi ${escapeHtml(opts.displayName)}, <strong>${escapeHtml(opts.addedBy)}</strong> added you to <strong>${escapeHtml(opts.teamName)}</strong>.</p>
     <p style="margin:0;"><a href="${opts.teamUrl}" style="display:inline-block;background:#3b46d4;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:8px;">Open team</a></p>`,
  );
  return { subject, text, html };
}

export function teamInviteMail(opts: {
  displayName: string;
  teamName: string;
  inviteUrl: string;
  invitedBy: string;
}) {
  const subject = `Invite to join ${opts.teamName} on DevTrack`;
  const text = `Hi ${opts.displayName},\n\n${opts.invitedBy} invited you to join ${opts.teamName}.\nAccept: ${opts.inviteUrl}\n`;
  const html = layout(
    `Join ${escapeHtml(opts.teamName)}`,
    `<p style="margin:0 0 16px;line-height:1.55;color:#4a5568;">Hi ${escapeHtml(opts.displayName)}, <strong>${escapeHtml(opts.invitedBy)}</strong> invited you to join <strong>${escapeHtml(opts.teamName)}</strong>.</p>
     <p style="margin:0;"><a href="${opts.inviteUrl}" style="display:inline-block;background:#3b46d4;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:8px;">View invite</a></p>`,
  );
  return { subject, text, html };
}

export function teamApprovedMail(opts: {
  displayName: string;
  teamName: string;
  teamUrl: string;
}) {
  const subject = `You’re in — ${opts.teamName} approved your request`;
  const text = `Hi ${opts.displayName},\n\nYour request to join ${opts.teamName} was approved.\n${opts.teamUrl}\n`;
  const html = layout(
    `Welcome to ${escapeHtml(opts.teamName)}`,
    `<p style="margin:0 0 16px;line-height:1.55;color:#4a5568;">Hi ${escapeHtml(opts.displayName)}, your join request for <strong>${escapeHtml(opts.teamName)}</strong> was approved.</p>
     <p style="margin:0;"><a href="${opts.teamUrl}" style="display:inline-block;background:#3b46d4;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 18px;border-radius:8px;">Open team</a></p>`,
  );
  return { subject, text, html };
}

export function teamJoinUrl(slug: string, inviteCode?: string | null) {
  if (inviteCode) return appUrl(`/teams/join?code=${encodeURIComponent(inviteCode)}`);
  return appUrl(`/teams/${encodeURIComponent(slug)}`);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
