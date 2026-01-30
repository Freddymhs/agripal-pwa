import type { SyncAdapter, SyncRequest, SyncResponse, PullRequest, PullResponse } from '../types'
import { getCurrentTimestamp } from '@/lib/utils'

export class MockAdapter implements SyncAdapter {
  private simulateLatency = true
  private latencyMs = 300

  async push(request: SyncRequest): Promise<SyncResponse> {
    if (this.simulateLatency) {
      await this.delay(this.latencyMs)
    }

    const updatedData = {
      ...request.datos,
      id: request.entidadId,
      updated_at: getCurrentTimestamp(),
      lastModified: getCurrentTimestamp(),
    }

    return {
      success: true,
      data: updatedData,
    }
  }

  async pull(_request: PullRequest): Promise<PullResponse> {
    if (this.simulateLatency) {
      await this.delay(this.latencyMs)
    }

    return {
      success: true,
      data: [],
      lastModified: getCurrentTimestamp(),
    }
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const mockAdapter = new MockAdapter()
