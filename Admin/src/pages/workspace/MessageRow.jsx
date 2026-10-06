import React, { memo } from 'react';
import { FiCornerUpLeft, FiTrash2, FiEdit2, FiStar } from 'react-icons/fi';
import { getFileUrl } from '../../services/api';
import { formatMessageTime } from './workspaceUtils';

const EMOJIS = ['👍', '❤️', '😂', '🎉', '👀'];

const Preview = memo(({ msg }) => {
  const url = getFileUrl(msg.fileUrl);
  if (!url) return null;
  if (msg.fileType === 'image') {
    return (
      <img
        src={url}
        alt={msg.fileName || 'Attached image'}
        className="mt-2 max-h-52 rounded-md border border-line object-contain"
      />
    );
  }
  if (msg.fileType === 'video') {
    return <video src={url} controls className="mt-2 max-h-52 w-full rounded-md bg-ink" />;
  }
  if (msg.fileType === 'audio') {
    return <audio src={url} controls className="mt-2 w-full" />;
  }
  if (msg.fileType === 'pdf') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[12px] font-medium text-brand hover:underline">
        {msg.fileName || 'Open PDF'}
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[12px] font-medium text-brand hover:underline">
      {msg.fileName || 'Download file'}
    </a>
  );
});

Preview.displayName = 'Preview';

const MessageRow = memo(({ msg, mine, senderName, onReply, onThread, onPin, onEdit, onDelete, onReact }) => (
  <article
    className="group relative rounded-md px-2 py-1.5 hover:bg-soft/80 focus-within:bg-soft/80"
    tabIndex={-1}
  >
    <div className="flex items-baseline gap-2">
      <span className="text-[13px] font-semibold text-ink">{mine ? 'You' : senderName}</span>
      <time className="text-[11px] text-muted" dateTime={msg.createdAt}>
        {formatMessageTime(msg.createdAt)}
      </time>
      {msg.editedAt && <span className="text-[11px] text-muted">(edited)</span>}
    </div>
    {msg.replyTo && <p className="mt-0.5 text-[11px] text-muted">Replying to a message</p>}
    {msg.forwardedFrom && <p className="mt-0.5 text-[11px] text-muted">Forwarded</p>}
    {msg.text && <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-5 text-ink">{msg.text}</p>}
    <Preview msg={msg} />
    {(msg.reactions || []).length > 0 && (
      <div className="mt-1 flex flex-wrap gap-1">
        {(msg.reactions || []).map((r) => (
          <button
            key={r.emoji}
            type="button"
            onClick={() => onReact(msg, r.emoji)}
            className="rounded-full border border-line bg-white px-1.5 py-0.5 text-[11px] hover:border-brand/40"
            aria-label={`${r.emoji} ${r.userIds?.length || 0}`}
          >
            {r.emoji} {r.userIds?.length || 0}
          </button>
        ))}
      </div>
    )}
    <div className="absolute right-2 top-1 hidden items-center gap-0.5 rounded-md border border-line bg-white px-1 py-0.5 group-hover:flex group-focus-within:flex">
      {EMOJIS.map((e) => (
        <button key={e} type="button" className="rounded px-1 text-[12px] hover:bg-soft" onClick={() => onReact(msg, e)} aria-label={`React ${e}`}>
          {e}
        </button>
      ))}
      <button type="button" className="rounded p-1 text-muted hover:bg-soft hover:text-ink" onClick={() => onReply(msg)} aria-label="Reply">
        <FiCornerUpLeft className="h-3.5 w-3.5" />
      </button>
      <button type="button" className="rounded px-1.5 text-[11px] text-muted hover:bg-soft hover:text-ink" onClick={() => onThread(msg)}>
        Thread
      </button>
      <button type="button" className="rounded p-1 text-muted hover:bg-soft hover:text-ink" onClick={() => onPin(msg)} aria-label="Pin">
        <FiStar className="h-3.5 w-3.5" />
      </button>
      {mine && (
        <>
          <button type="button" className="rounded p-1 text-muted hover:bg-soft hover:text-ink" onClick={() => onEdit(msg)} aria-label="Edit">
            <FiEdit2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" className="rounded p-1 text-muted hover:bg-soft hover:text-danger" onClick={() => onDelete(msg)} aria-label="Delete">
            <FiTrash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  </article>
));

MessageRow.displayName = 'MessageRow';

export default MessageRow;
