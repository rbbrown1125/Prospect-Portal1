import { Buffer } from "node:buffer";

interface AirtableAttachment {
  id: string;
  url: string;
}

export interface AirtableUploadResult {
  url: string;
  recordId: string;
  attachmentId: string;
}

// TESTING ONLY: Hardcoded API keys (REMOVE IN PRODUCTION)
const HARDCODED_AIRTABLE_KEY = process.env.AIRTABLE_API_KEY || '';
const HARDCODED_AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID || '';

const airtableTableName = process.env.AIRTABLE_TABLE_NAME ?? "Assets";
const airtableAttachmentField = process.env.AIRTABLE_ATTACHMENT_FIELD ?? "File";

function getAirtableConfig(): { apiKey: string; baseId: string } {
  const apiKey = HARDCODED_AIRTABLE_KEY;
  const baseId = HARDCODED_AIRTABLE_BASE;

  if (!apiKey || !baseId) {
    throw new Error("Airtable integration is not configured. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.");
  }

  return { apiKey, baseId };
}

export async function uploadBufferToAirtable(
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata: Record<string, unknown> = {}
): Promise<AirtableUploadResult> {
  const { apiKey, baseId } = getAirtableConfig();

  const endpoint = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(airtableTableName)}`;
  const payload = {
    fields: {
      [airtableAttachmentField]: [
        {
          filename,
          type: contentType,
          data: buffer.toString("base64"),
        },
      ],
      ...metadata,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to upload asset to Airtable: ${response.status} ${message}`);
  }

  const body = await response.json();
  const attachment = (body?.fields?.[airtableAttachmentField] as AirtableAttachment[] | undefined)?.[0];
  if (!attachment) {
    throw new Error("Airtable response did not include an attachment URL");
  }

  return {
    url: attachment.url,
    recordId: body.id as string,
    attachmentId: attachment.id,
  };
}

export async function deleteAirtableAsset(recordId: string): Promise<void> {
  const { apiKey, baseId } = getAirtableConfig();

  if (!recordId) {
    return;
  }

  const endpoint = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(airtableTableName)}/${recordId}`;
  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const message = await response.text();
    throw new Error(`Failed to delete Airtable asset: ${response.status} ${message}`);
  }
}
