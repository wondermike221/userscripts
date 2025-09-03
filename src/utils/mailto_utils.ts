// Email template interface for type safety
export interface EmailTemplate {
  to: string;
  cc: string;
  subject: string;
  body: string;
  htmlBody?: string; // Optional rich HTML version
}

// Asset interface for type safety
export interface Asset {
  model: string;
  serialNumber: string;
  assetTag: string;
}

// Helper function to create and automatically invoke mailto link
export function createAndInvokeMailto(
  to: string,
  cc: string,
  subject: string,
  body: string,
) {
  // URL encode the parameters
  const encodedTo = encodeURIComponent(to);
  const encodedCC = encodeURIComponent(cc);
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  // Create mailto URL
  const mailtoUrl = `mailto:${encodedTo}?cc=${encodedCC}&subject=${encodedSubject}&body=${encodedBody}`;

  // Create anchor element and click it automatically
  const anchor = document.createElement('a');
  anchor.href = mailtoUrl;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  console.log('Mailto link invoked:', mailtoUrl);
}

// Helper function to format assets for email templates
export function formatAssets(input: Asset[]): string {
  return input.reduce((acc: string, cur: Asset) => {
    return `${acc}${formatAsset(cur)}\n`;
  }, '');
}

// Helper function to format a single asset
export function formatAsset(asset: Asset): string {
  return `- ${asset.model} [SN: ${asset.serialNumber}, Tag: ${asset.assetTag}]`;
}

// Helper function to copy HTML content to clipboard
export async function copyHtmlToClipboard(htmlContent: string) {
  try {
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([htmlContent], { type: 'text/html' }),
      'text/plain': new Blob([htmlContent.replace(/<[^>]*>/g, '')], {
        type: 'text/plain',
      }),
    });
    await navigator.clipboard.write([clipboardItem]);
    console.log('Rich HTML content copied to clipboard');
    return true;
  } catch (err) {
    console.warn('Failed to copy HTML to clipboard:', err);
    return false;
  }
}

// Helper function to send email using template
export function sendEmailFromTemplate(template: EmailTemplate) {
  // Always open the mailto link with plain text
  createAndInvokeMailto(
    template.to,
    template.cc,
    template.subject,
    template.body,
  );

  // If HTML version is available, copy it to clipboard
  if (template.htmlBody) {
    copyHtmlToClipboard(template.htmlBody).then((success) => {
      if (success) {
        // Show a brief notification that HTML was copied
        showNotification(
          'Rich HTML version copied to clipboard - paste into your email client for better formatting!',
        );
      }
    });
  }
}

// Helper function to show a temporary notification
export function showNotification(message: string) {
  const notification = document.createElement('div');
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        max-width: 300px;
    `;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

// Helper function to create tracking links for various couriers
export function makeTrackingLink(tracking: string): string {
  let trackingLink = '';
  let courierName = 'Courier';

  // Detect courier based on tracking number patterns
  if (/^1Z[0-9A-Z]{16}$/.test(tracking)) {
    // UPS tracking number
    trackingLink = `https://www.ups.com/track?loc=en_US&tracknum=${tracking}`;
    courierName = 'UPS';
  } else if (
    /^[0-9]{12}$/.test(tracking) ||
    /^[0-9]{15}$/.test(tracking) ||
    /^[0-9]{20}$/.test(tracking)
  ) {
    // FedEx tracking number (12, 15, or 20 digits)
    trackingLink = `https://www.fedex.com/fedextrack/?trknbr=${tracking}`;
    courierName = 'FedEx';
  } else if (
    /^(94|93|92|94|95)[0-9]{20}$/.test(tracking) ||
    /^[A-Z]{2}[0-9]{9}US$/.test(tracking)
  ) {
    // USPS tracking number
    trackingLink = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tracking}`;
    courierName = 'USPS';
  } else if (/^[0-9]{10}$/.test(tracking)) {
    // DHL tracking number (10 digits)
    trackingLink = `https://www.dhl.com/en/express/tracking.html?AWB=${tracking}`;
    courierName = 'DHL';
  } else {
    // Generic/unknown courier - try a universal tracking service
    trackingLink = `https://www.google.com/search?q=track+package+${tracking}`;
    courierName = 'Track';
  }

  return `<a href="${trackingLink}" target="_blank"><strong>${courierName}: ${tracking}</strong></a>`;
}

// Simple helper functions for markdown-equivalent HTML formatting (no custom styling)

// Create basic HTML email body with no custom styling
export function createSimpleHtmlBody(content: string): string {
  return content; // No wrapper div, let email client use defaults
}

// Bold text (markdown: **text**)
export function bold(text: string): string {
  return `<strong>${text}</strong>`;
}

// Italic text (markdown: *text*)
export function italic(text: string): string {
  return `<em>${text}</em>`;
}

// Underlined text
export function underline(text: string): string {
  return `<u>${text}</u>`;
}

// Simple link (markdown: [text](url))
export function link(url: string, text: string): string {
  return `<a href="${url}">${text}</a>`;
}

// Headers (markdown: # ## ###)
export function h1(text: string): string {
  return `<h1>${text}</h1>`;
}

export function h2(text: string): string {
  return `<h2>${text}</h2>`;
}

export function h3(text: string): string {
  return `<h3>${text}</h3>`;
}

// Line break
export function br(): string {
  return '<br>';
}

// Horizontal rule (markdown: ---)
export function hr(): string {
  return '<hr>';
}

// Create an image with optional alt text and size
export function image(
  src: string,
  alt: string = '',
  width?: number,
  height?: number,
): string {
  let style = '';
  if (width) style += `width: ${width}px; `;
  if (height) style += `height: ${height}px; `;

  return `<img src="${src}" alt="${alt}" style="${style}" />`;
}

// Create an embedded image from base64 data
export function embeddedImage(
  base64Data: string,
  mimeType: string = 'image/png',
  alt: string = '',
  width?: number,
  height?: number,
): string {
  const dataUrl = `data:${mimeType};base64,${base64Data}`;
  return image(dataUrl, alt, width, height);
}

// Helper to convert image file to base64 (for use in bookmarklets)
export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64 data
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
