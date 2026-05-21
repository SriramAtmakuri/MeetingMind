import { getSessionUserId } from '@/lib/session';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const userId = getSessionUserId();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(userId && { 'X-User-Id': userId }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(response.status, error.message || error.error || 'Request failed');
  }

  return response.json();
}

// Meetings API
export const meetingsApi = {
  getAll: (params?: {
    userId?: string;
    limit?: number;
    offset?: number;
    category?: string;
    status?: string;
    isFavorite?: boolean;
    sortBy?: string;
    sortOrder?: string;
    tags?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.isFavorite) searchParams.set('isFavorite', 'true');
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);
    if (params?.tags) searchParams.set('tags', params.tags);

    const query = searchParams.toString();
    return fetchApi<{ meetings: any[]; total: number }>(`/meetings${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => fetchApi<any>(`/meetings/${id}`),

  update: (id: string, data: { title?: string; status?: string }) =>
    fetchApi<any>(`/meetings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean; id: string }>(`/meetings/${id}`, {
      method: 'DELETE',
    }),

  bulkDelete: (meetingIds: string[]) =>
    fetchApi<{ success: boolean; deletedCount: number; deletedIds: string[] }>(`/meetings/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingIds }),
    }),

  toggleFavorite: (id: string) =>
    fetchApi<any>(`/meetings/${id}/favorite`, {
      method: 'PATCH',
    }),

  updateMetadata: (id: string, data: { tags?: string | string[]; category?: string; notes?: string }) =>
    fetchApi<any>(`/meetings/${id}/metadata`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  updateActionItem: (meetingId: string, actionId: string, data: any) =>
    fetchApi<any>(`/meetings/${meetingId}/actions/${actionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  updateSpeaker: (meetingId: string, speakerId: string, data: { customName?: string; color?: string; email?: string; role?: string }) =>
    fetchApi<any>(`/meetings/${meetingId}/speakers/${speakerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Comments
  getComments: (meetingId: string) => fetchApi<any[]>(`/meetings/${meetingId}/comments`),

  addComment: (meetingId: string, data: { userId?: string; text: string; transcriptId?: string; timestamp?: number }) =>
    fetchApi<any>(`/meetings/${meetingId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // Highlights
  getHighlights: (meetingId: string) => fetchApi<any[]>(`/meetings/${meetingId}/highlights`),

  addHighlight: (meetingId: string, data: { userId?: string; startTime: number; endTime: number; text?: string; color?: string }) =>
    fetchApi<any>(`/meetings/${meetingId}/highlights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteHighlight: (meetingId: string, highlightId: string) =>
    fetchApi<{ success: boolean }>(`/meetings/${meetingId}/highlights/${highlightId}`, {
      method: 'DELETE',
    }),
};

// Upload API
export const uploadApi = {
  uploadFile: async (file: File, title: string, onProgress?: (progress: number) => void, agenda?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (agenda) formData.append('agenda', agenda);

    const xhr = new XMLHttpRequest();

    return new Promise<any>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new ApiError(xhr.status, 'Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${API_BASE_URL}/upload`);
      xhr.send(formData);
    });
  },

  getStatus: (meetingId: string) => fetchApi<any>(`/upload/${meetingId}/status`),
};

// Search API
export const searchApi = {
  search: (query: string, params?: { userId?: string; limit?: number }) => {
    const searchParams = new URLSearchParams({ q: query });
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return fetchApi<{ query: string; total: number; results: any[] }>(
      `/search?${searchParams.toString()}`
    );
  },

  getHistory: (userId: string, limit?: number) => {
    const searchParams = new URLSearchParams({ userId });
    if (limit) searchParams.set('limit', limit.toString());

    return fetchApi<any[]>(`/search/history?${searchParams.toString()}`);
  },

  clearHistory: (userId: string) =>
    fetchApi<{ success: boolean }>(`/search/history?userId=${userId}`, {
      method: 'DELETE',
    }),
};

// Analytics API
export const analyticsApi = {
  getSummary: (userId?: string) => {
    const params = userId ? `?userId=${userId}` : '';
    return fetchApi<any>(`/analytics/summary${params}`);
  },

  getTrends: (userId?: string, days?: number) => {
    const searchParams = new URLSearchParams();
    if (userId) searchParams.set('userId', userId);
    if (days) searchParams.set('days', days.toString());

    const query = searchParams.toString();
    return fetchApi<any>(`/analytics/trends${query ? `?${query}` : ''}`);
  },
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { userId?: string; isRead?: boolean; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.isRead !== undefined) searchParams.set('isRead', params.isRead.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return fetchApi<any[]>(`/notifications${query ? `?${query}` : ''}`);
  },

  markAsRead: (id: string) =>
    fetchApi<any>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllAsRead: (userId: string) =>
    fetchApi<{ success: boolean }>(`/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }),

  create: (data: { userId?: string; type: string; title: string; message?: string; meetingId?: string }) =>
    fetchApi<any>(`/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/notifications/${id}`, {
      method: 'DELETE',
    }),
};

// Action Items API
export const actionItemsApi = {
  getAll: (params?: { userId?: string; status?: string; assignee?: string; priority?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.assignee) searchParams.set('assignee', params.assignee);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return fetchApi<any[]>(`/action-items${query ? `?${query}` : ''}`);
  },

  getStats: (userId?: string) => {
    const params = userId ? `?userId=${userId}` : '';
    return fetchApi<{ total: number; pending: number; completed: number; overdue: number }>(`/action-items/stats${params}`);
  },

  getKanban: (userId?: string) => {
    const params = userId ? `?userId=${userId}` : '';
    return fetchApi<{ pending: any[]; in_progress: any[]; completed: any[] }>(`/action-items/kanban${params}`);
  },
};

// Export API
export const exportApi = {
  exportTranscript: (meetingId: string) => {
    window.open(`${API_BASE_URL}/exports/${meetingId}/transcript/txt`, '_blank');
  },

  exportSummary: (meetingId: string) => {
    window.open(`${API_BASE_URL}/exports/${meetingId}/summary/txt`, '_blank');
  },

  exportMarkdown: (meeting: any) => {
    const actionItems = meeting.action_items || [];
    const decisions = meeting.decisions || [];
    const transcript = meeting.transcript || [];
    const speakers = meeting.speakers || [];

    const speakerMap: Record<string, string> = {};
    speakers.forEach((s: any) => {
      speakerMap[s.id] = s.custom_name || s.name || 'Unknown';
    });

    const lines: string[] = [
      `# ${meeting.title}`,
      '',
      `**Date:** ${new Date(meeting.created_at).toLocaleDateString()}`,
      meeting.duration ? `**Duration:** ${Math.floor(meeting.duration / 60)} min` : '',
      meeting.overall_sentiment ? `**Sentiment:** ${meeting.overall_sentiment}` : '',
      meeting.category ? `**Category:** ${meeting.category}` : '',
      '',
    ];

    if (meeting.summary) {
      lines.push('## Summary', '', meeting.summary, '');
    }

    if (meeting.topics) {
      lines.push('## Topics', '', meeting.topics.split(',').map((t: string) => `- ${t.trim()}`).join('\n'), '');
    }

    if (actionItems.length > 0) {
      lines.push('## Action Items', '');
      actionItems.forEach((item: any) => {
        const assignee = item.assignee ? ` *(${item.assignee})* ` : ' ';
        const due = item.due_date ? ` — due ${new Date(item.due_date).toLocaleDateString()}` : '';
        lines.push(`- [ ]${assignee}${item.text}${due}`);
      });
      lines.push('');
    }

    if (decisions.length > 0) {
      lines.push('## Key Decisions', '');
      decisions.forEach((d: any) => {
        lines.push(`- ${d.text}`);
        if (d.reasoning) lines.push(`  *${d.reasoning}*`);
      });
      lines.push('');
    }

    if (transcript.length > 0) {
      lines.push('## Transcript', '');
      transcript.forEach((item: any) => {
        const name = speakerMap[item.speaker_id] || 'Unknown';
        const mins = Math.floor(item.start_time / 60);
        const secs = String(Math.floor(item.start_time % 60)).padStart(2, '0');
        lines.push(`**${name}** *(${mins}:${secs})*: ${item.text}`, '');
      });
    }

    const content = lines.filter(l => l !== null && l !== undefined).join('\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  },

  getHistory: (params?: { userId?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return fetchApi<any[]>(`/exports/history${query ? `?${query}` : ''}`);
  },
};

// AI Chat API
export const aiChatApi = {
  chatWithMeeting: (meetingId: string, question: string) =>
    fetchApi<{ answer: string; meetingTitle: string; timestamp: string }>(`/ai-chat/${meetingId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    }),

  searchAll: (question: string, userId?: string) =>
    fetchApi<{ answer: string; relevantMeetings: any[] }>(`/ai-chat/search-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, userId }),
    }),
};

// Templates API
export const templatesApi = {
  getAll: (userId?: string) => {
    const params = userId ? `?userId=${userId}` : '';
    return fetchApi<any[]>(`/templates${params}`);
  },

  create: (data: { userId?: string; name: string; category?: string; defaultTags?: string[]; actionItemTemplates?: any }) =>
    fetchApi<any>(`/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; category?: string; defaultTags?: string[]; actionItemTemplates?: any }) =>
    fetchApi<any>(`/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/templates/${id}`, {
      method: 'DELETE',
    }),

  getCategories: (userId?: string) => {
    const params = userId ? `?userId=${userId}` : '';
    return fetchApi<string[]>(`/templates/categories${params}`);
  },

  apply: (id: string) =>
    fetchApi<{ success: boolean; meeting: any; template: any }>(`/templates/${id}/apply`, {
      method: 'POST',
    }),
};

// Comparisons API
export const comparisonsApi = {
  compare: (meetingId1: string, meetingId2: string, userId?: string) =>
    fetchApi<any>(`/comparisons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, meetingId1, meetingId2 }),
    }),

  getHistory: (params?: { userId?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return fetchApi<any[]>(`/comparisons/history${query ? `?${query}` : ''}`);
  },

  getById: (id: string) => fetchApi<any>(`/comparisons/${id}`),
};

// Seed / Demo Data API
export const seedApi = {
  seed: () =>
    fetchApi<{ message: string; meetings: any[]; seeded: boolean }>(`/seed`, {
      method: 'POST',
    }),

  clear: () =>
    fetchApi<{ message: string; count: number }>(`/seed`, {
      method: 'DELETE',
    }),
};

export { ApiError };
