import React from 'react';
import { Reply, Trash2, MoreVertical } from 'lucide-react';

interface MessageContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onReply: () => void;
  onDelete: () => void;
  position: { x: number; y: number };
  isOwnMessage: boolean;
}

export default function MessageContextMenu({
  isOpen,
  onClose,
  onReply,
  onDelete,
  position,
  isOwnMessage
}: MessageContextMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-32"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <button
          onClick={() => {
            onReply();
            onClose();
          }}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
        >
          <Reply className="h-4 w-4" />
          <span>Répondre</span>
        </button>
        
        {isOwnMessage && (
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Supprimer</span>
          </button>
        )}
      </div>
    </>
  );
}
