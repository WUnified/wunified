import { useRef, useState } from 'react';

import { pickImage } from '../../lib/pickImage';
import type { PickedImage } from '../../lib/pickImage';

// Keeps a message to a readable grid; the database allows up to 10 per message.
export const MAX_PHOTOS_PER_MESSAGE = 4;

export type MessageAttachment = PickedImage & { key: string };

// Photos picked for the next message. They stay until the message sends, so a failed
// upload can be retried without picking them again.
export function useMessageAttachments() {
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const nextKey = useRef(0);

  async function add() {
    if (attachments.length >= MAX_PHOTOS_PER_MESSAGE) return;
    setError(null);
    try {
      const picked = await pickImage();
      if (!picked) return;
      nextKey.current += 1;
      const key = `photo-${nextKey.current}`;
      setAttachments((current) => [...current, { ...picked, key }]);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Unable to add that photo.');
    }
  }

  function remove(key: string) {
    setAttachments((current) => current.filter((attachment) => attachment.key !== key));
  }

  return {
    attachments,
    canAdd: attachments.length < MAX_PHOTOS_PER_MESSAGE,
    error,
    add,
    remove,
    clear: () => setAttachments([]),
    // The upload only needs the bytes and type, not the preview URI or key.
    toUploads: () => attachments.map(({ data, contentType }) => ({ data, contentType })),
  };
}
