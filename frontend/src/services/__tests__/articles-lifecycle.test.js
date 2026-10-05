import { describe, it, expect, vi, beforeEach } from 'vitest';
import { articlesApi } from '../articles.api.js';
import { apiClient } from '../api.client.js';

describe('articlesApi modifyChanges and discardDraft endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls POST /articles/:id/modify-changes with payload', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: 'art-123', status: 'PUBLISHED', hasUnpublishedChanges: false },
        publishedLive: true,
        message: 'Article modifications published live successfully'
      }
    });

    const payload = { title: 'Updated Title', blocks: [] };
    const res = await articlesApi.modifyChanges('art-123', payload);

    expect(postSpy).toHaveBeenCalledWith('/articles/art-123/modify-changes', payload);
    expect(res.data.success).toBe(true);
    expect(res.data.publishedLive).toBe(true);
  });

  it('calls POST /articles/:id/discard-draft', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: 'art-123', status: 'PUBLISHED', hasUnpublishedChanges: false },
        message: 'Draft modifications discarded.'
      }
    });

    const res = await articlesApi.discardDraft('art-123');

    expect(postSpy).toHaveBeenCalledWith('/articles/art-123/discard-draft');
    expect(res.data.success).toBe(true);
    expect(res.data.data.hasUnpublishedChanges).toBe(false);
  });
});
