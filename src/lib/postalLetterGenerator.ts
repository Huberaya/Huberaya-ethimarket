import type { CertificationBody } from './supabase';

export interface PostalLetterParams {
  certificationBody: CertificationBody;
  certificateNumber?: string;
  producerName?: string;
  certificationType?: string;
  adminName?: string;
  adminRole?: string;
  contactEmail?: string;
  contactPhone?: string;
  issueDate?: string;
  platformName?: string;
}

/**
 * Génère le code HTML complet et stylisé pour une lettre officielle d'audit postal
 * prête pour impression directe ou conversion PDF (via window.print() dans une iframe sécurisée ou nouvel onglet).
 */
export function generatePostalLetterHtml(params: PostalLetterParams): string {
  const {
    certificationBody: body,
    certificateNumber = 'N/A',
    producerName = '[Nom du Producteur]',
    certificationType = 'Agriculture Biologique / Commerce Équitable',
    adminName = 'Service Conformité & Audits',
    adminRole = 'Responsable Vérification Partenaires',
    contactEmail = 'conformite@ethimarket.com',
    contactPhone = '+33 1 89 70 00 00',
    platformName = 'EthiMarket Global Platform'
  } = params;

  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Demande officielle de confirmation de certificat — ${body.name}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      font-size: 11pt;
      margin: 0;
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #059669;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    .platform-brand {
      font-size: 18pt;
      font-weight: bold;
      color: #059669;
      letter-spacing: -0.5px;
    }
    .platform-sub {
      font-size: 9pt;
      color: #6b7280;
      margin-top: 4px;
    }
    .sender-box {
      font-size: 9pt;
      color: #4b5563;
      line-height: 1.4;
    }
    .recipient-box {
      margin-left: 50%;
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      margin-bottom: 35px;
    }
    .recipient-name {
      font-weight: bold;
      font-size: 11pt;
      color: #111827;
    }
    .meta-date {
      margin-bottom: 25px;
      font-size: 10pt;
      color: #4b5563;
    }
    .subject-line {
      font-weight: bold;
      font-size: 12pt;
      color: #0f172a;
      background: #ecfdf5;
      padding: 8px 12px;
      border-left: 4px solid #059669;
      margin-bottom: 25px;
    }
    .content p {
      margin-bottom: 14px;
      text-align: justify;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 10pt;
    }
    .info-table th, .info-table td {
      border: 1px solid #d1d5db;
      padding: 8px 12px;
      text-align: left;
    }
    .info-table th {
      background: #f3f4f6;
      font-weight: 600;
      width: 35%;
    }
    .signature-section {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    .stamp-box {
      width: 160px;
      height: 90px;
      border: 1px dashed #9ca3af;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      color: #9ca3af;
      text-transform: uppercase;
    }
    .sign-block {
      text-align: right;
    }
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 8pt;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="platform-brand">🌱 ${platformName}</div>
      <div class="platform-sub">Plateforme Mondiale du Commerce Éthique & Traçable</div>
    </div>
    <div class="sender-box">
      <strong>Département Conformité & Audits</strong><br>
      Email : ${contactEmail}<br>
      Tél : ${contactPhone}<br>
      Web : https://ethimarket.com
    </div>
  </div>

  <div class="recipient-box">
    <div class="recipient-name">${body.name} ${body.acronym ? `(${body.acronym})` : ''}</div>
    <div>${body.address || 'Direction des Audits & Certifications'}</div>
    <div>${body.city ? `${body.postal_code || ''} ${body.city}` : ''}</div>
    <div><strong>${body.country.toUpperCase()}</strong></div>
    ${body.email_contact ? `<div style="font-size:8.5pt; color:#6b7280; margin-top:4px;">Réf. contact : ${body.email_contact}</div>` : ''}
  </div>

  <div class="meta-date">
    Fait à Paris, le ${today}
  </div>

  <div class="subject-line">
    OBJET : Demande d'attestation de validité et vérification d'authenticité de certificat
  </div>

  <div class="content">
    <p>Madame, Monsieur le Responsable des Certifications,</p>

    <p>
      Dans le cadre de nos audits de conformité et de notre charte d'intégrité pour l'accès aux marchés internationaux, nous procédons à la vérification systématique des titres de certification soumis par nos producteurs partenaires.
    </p>

    <p>
      Le producteur mentionné ci-dessous a déposé auprès de nos services une attestation de conformité émise sous votre autorité :
    </p>

    <table class="info-table">
      <tr>
        <th>Nom du Producteur / Organisation</th>
        <td><strong>${producerName}</strong></td>
      </tr>
      <tr>
        <th>Numéro de certificat déclaré</th>
        <td><strong style="color:#047857;">${certificateNumber}</strong></td>
      </tr>
      <tr>
        <th>Type de certification / Standard</th>
        <td>${certificationType}</td>
      </tr>
      <tr>
        <th>Organisme émetteur enregistré</th>
        <td>${body.name} (${body.country})</td>
      </tr>
    </table>

    <p>
      Afin de valider son référencement sur notre place de marché éthique, nous vous saurions gré de bien vouloir nous confirmer par retour de courrier ou par email (<strong>${contactEmail}</strong>) les éléments suivants :
    </p>
    <ul>
      <li>L'authenticité et la validité en cours du certificat n° <strong>${certificateNumber}</strong> ;</li>
      <li>Le périmètre exact des produits couverts et la date d'échéance officielle du titre ;</li>
      <li>L'absence de suspension ou de procédure de retrait en cours.</li>
    </ul>

    <p>
      Nous vous remercions chaleureusement pour votre coopération au service de la transparence des filières agricoles et artisanales durables.
    </p>
  </div>

  <div class="signature-section">
    <div class="stamp-box">
      Cachet officiel EthiMarket
    </div>
    <div class="sign-block">
      <strong>${adminName}</strong><br>
      <span style="font-size:9.5pt; color:#4b5563;">${adminRole}</span><br>
      <span style="font-size:9pt; color:#059669; font-weight:600;">EthiMarket Compliance Division</span>
    </div>
  </div>

  <div class="footer">
    EthiMarket SAS — Système de vérification des tiers de confiance — Document généré pour audit postal
  </div>

  <script>
    window.onload = function() {
      // Impression automatique si demandée
      if (window.location.search.includes('print=true')) {
        window.print();
      }
    };
  </script>
</body>
</html>
  `.trim();
}

/**
 * Ouvre la lettre dans une nouvelle fenêtre avec boîte de dialogue d'impression
 */
export function printPostalLetter(params: PostalLetterParams) {
  const html = generatePostalLetterHtml(params);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
