const nodemailer = require("nodemailer");

let mailer;

function isEmailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function isEmailTestMode() {
  return String(process.env.EMAIL_TEST_MODE || "").toLowerCase() === "true";
}

function getTestRecipient() {
  return (process.env.EMAIL_TEST_TO_EMAIL || "").trim();
}

function getMailer() {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!mailer) {
    mailer = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 2,
      maxMessages: 100,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      auth: {
        user: process.env.GMAIL_USER.trim(),
        pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ""),
      },
    });
  }

  return mailer;
}

function getRecipientDomain(email) {
  return String(email || "").split("@").pop() || "desconocido";
}

function logDelivery(level, message, details) {
  console[level](`[email] ${message}`, details);
}

async function sendEmail({ to, subject, html, text, required = false, kind }) {
  const fromName = (process.env.EMAIL_FROM_NAME || "ProfeConnect").trim();
  const from = `${fromName} <${process.env.GMAIL_USER || "correo-no-configurado"}>`;
  const transport = getMailer();
  const testMode = isEmailTestMode();
  const testRecipient = getTestRecipient();
  const recipient = testMode ? testRecipient : to;
  const finalSubject = testMode ? `[TEST] ${subject}` : subject;
  const finalHtml = testMode
    ? html.replace("</div>\n    </div>", `${paragraph(`Destinatario original: ${to}`)}</div>\n    </div>`)
    : html;
  const finalText = testMode
    ? `${text}\n\nDestinatario original: ${to}`
    : text;
  const startedAt = Date.now();
  const logContext = {
    kind,
    recipientDomain: getRecipientDomain(recipient || to),
    testMode,
  };

  if (!transport) {
    const message = "Correo no enviado porque Gmail no esta configurado";

    if (process.env.NODE_ENV === "production") {
      const error = new Error(message);
      error.statusCode = required ? 503 : 500;
      throw error;
    }

    console.info("[email:dev]", {
      to: recipient || to,
      originalTo: testMode ? to : undefined,
      from,
      subject: finalSubject,
      text: finalText,
    });
    return null;
  }

  if (testMode && !testRecipient) {
    const message = "EMAIL_TEST_MODE esta activo, pero EMAIL_TEST_TO_EMAIL no esta configurado";

    if (process.env.NODE_ENV === "production" || required) {
      const error = new Error(message);
      error.statusCode = required ? 503 : 500;
      throw error;
    }

    console.warn(message);
    console.info("[email:dev]", {
      to,
      from,
      subject: finalSubject,
      text: finalText,
    });
    return null;
  }

  try {
    const result = await transport.sendMail({
      from,
      to: recipient,
      subject: finalSubject,
      html: finalHtml,
      text: finalText,
    });

    logDelivery("info", "enviado", {
      ...logContext,
      durationMs: Date.now() - startedAt,
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    logDelivery("error", "fallo", {
      ...logContext,
      durationMs: Date.now() - startedAt,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      message: error.message,
    });
    error.statusCode = required ? 503 : undefined;
    throw error;
  }
}

function sendEmailInBackground(send, kind) {
  Promise.resolve()
    .then(send)
    .catch((error) => {
      logDelivery("warn", "notificacion no entregada", {
        kind,
        code: error.code,
        message: error.message,
      });
    });
}

async function verifyEmailTransport() {
  const transport = getMailer();

  if (!transport) {
    logDelivery("warn", "SMTP no configurado", {});
    return false;
  }

  const startedAt = Date.now();

  try {
    await transport.verify();
    logDelivery("info", "SMTP disponible", {
      durationMs: Date.now() - startedAt,
    });
    return true;
  } catch (error) {
    logDelivery("error", "SMTP no disponible", {
      durationMs: Date.now() - startedAt,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      message: error.message,
    });
    return false;
  }
}

function paragraph(value) {
  return `<p style="margin:0 0 12px;color:#334155;line-height:1.5">${value}</p>`;
}

function button(url, label) {
  return `<p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px">${label}</a></p>`;
}

function layout(title, body) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
        <h1 style="margin:0 0 16px;color:#0f172a;font-size:22px">${title}</h1>
        ${body}
        <p style="margin:24px 0 0;color:#64748b;font-size:12px">ProfeConnect</p>
      </div>
    </div>
  `;
}

async function sendRegistrationReceivedEmail(request) {
  return sendEmail({
    kind: "registration_received",
    to: request.institutionalEmail,
    subject: "Solicitud de registro recibida",
    html: layout(
      "Solicitud recibida",
      [
        paragraph(`Hola ${request.firstName}, recibimos correctamente tu solicitud de registro.`),
        paragraph("Un administrador revisara la informacion y te notificaremos cuando sea aprobada o rechazada."),
      ].join("")
    ),
    text: `Hola ${request.firstName}, recibimos correctamente tu solicitud de registro. Un administrador revisara la informacion.`,
  });
}

async function sendInstitutionalVerificationEmail(request, verificationUrl) {
  return sendEmail({
    kind: "institutional_verification",
    to: request.institutionalEmail,
    subject: "Verifica tu correo institucional",
    required: true,
    html: layout(
      "Verifica tu correo institucional",
      [
        paragraph(`Hola ${request.firstName}, confirma que este correo institucional te pertenece para activar tu cuenta.`),
        button(verificationUrl, "Verificar correo"),
        paragraph("Si no solicitaste este registro, puedes ignorar este mensaje."),
      ].join("")
    ),
    text: `Verifica tu correo institucional abriendo este enlace: ${verificationUrl}`,
  });
}

async function sendRegistrationApprovedEmail(request) {
  return sendEmail({
    kind: "registration_approved",
    to: request.institutionalEmail,
    subject: "Solicitud de registro aprobada",
    html: layout(
      "Solicitud aprobada",
      [
        paragraph(`Hola ${request.firstName}, tu solicitud fue aprobada.`),
        paragraph("Ya puedes iniciar sesion en ProfeConnect con tu correo institucional y contrasena."),
      ].join("")
    ),
    text: `Hola ${request.firstName}, tu solicitud fue aprobada. Ya puedes iniciar sesion en ProfeConnect.`,
  });
}

async function sendRegistrationRejectedEmail(request) {
  const reason = request.reviewComment
    ? paragraph(`Motivo: ${request.reviewComment}`)
    : "";

  return sendEmail({
    kind: "registration_rejected",
    to: request.institutionalEmail,
    subject: "Solicitud de registro rechazada",
    html: layout(
      "Solicitud rechazada",
      [
        paragraph(`Hola ${request.firstName}, tu solicitud de registro fue rechazada.`),
        reason,
        paragraph("Si crees que se trata de un error, contacta con la administracion de la institucion."),
      ].join("")
    ),
    text: `Hola ${request.firstName}, tu solicitud de registro fue rechazada.${request.reviewComment ? ` Motivo: ${request.reviewComment}` : ""}`,
  });
}

async function sendInstitutionalAccountActivatedEmail(request) {
  return sendEmail({
    kind: "institutional_account_activated",
    to: request.institutionalEmail,
    subject: "Cuenta activada",
    html: layout(
      "Cuenta activada",
      [
        paragraph(`Hola ${request.firstName}, tu correo institucional fue verificado correctamente.`),
        paragraph("Tu cuenta docente ya esta activa y puedes iniciar sesion en ProfeConnect."),
      ].join("")
    ),
    text: `Hola ${request.firstName}, tu cuenta docente ya esta activa y puedes iniciar sesion en ProfeConnect.`,
  });
}

module.exports = {
  isEmailConfigured,
  sendEmailInBackground,
  verifyEmailTransport,
  sendRegistrationReceivedEmail,
  sendInstitutionalVerificationEmail,
  sendRegistrationApprovedEmail,
  sendRegistrationRejectedEmail,
  sendInstitutionalAccountActivatedEmail,
};
