import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { openUrl } from '@tauri-apps/plugin-opener'
import type { GoogleAccount } from './types'

const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

function describeGoogleOAuthError(status: number, details: string): string {
  const normalized = details.toLowerCase()

  if (normalized.includes('client_secret is missing')) {
    return `token exchange failed (${status}): client_secret is missing. this usually means you used the wrong oauth client type. create a google oauth client with application type 'Desktop app' and use that client id here.`
  }

  if (normalized.includes('redirect_uri_mismatch')) {
    return `token exchange failed (${status}): redirect uri mismatch. use a google oauth client with application type 'Desktop app'.`
  }

  if (normalized.includes('unauthorized_client')) {
    return `token exchange failed (${status}): unauthorized client. verify the calendar api is enabled and the oauth client is a desktop app client.`
  }

  if (normalized.includes('invalid_grant')) {
    return `token exchange failed (${status}): invalid grant. retry the flow and make sure you complete the browser authorization only once.`
  }

  return details ? `token exchange failed (${status}): ${details}` : `token exchange failed (${status})`
}

function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, n => chars[n % chars.length]).join('')
}

function toBase64Url(bytes: Uint8Array): string {
  let value = ''
  bytes.forEach(b => { value += String.fromCharCode(b) })
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return toBase64Url(new Uint8Array(digest))
}

export interface GoogleOAuthSession {
  codeVerifier: string
  state: string
}

export interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  token_type: string
  id_token?: string
}

export async function createGoogleOAuthUrl(clientId: string): Promise<{ authUrl: string; session: GoogleOAuthSession }> {
  const codeVerifier = randomString(64)
  const state = randomString(32)
  const challenge = await sha256(codeVerifier)
  const url = new URL(AUTH_ENDPOINT)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', '__REDIRECT_URI__')
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', GOOGLE_SCOPE)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', state)
  url.searchParams.set('access_type', 'offline')
  url.searchParams.set('prompt', 'consent')

  return {
    authUrl: url.toString(),
    session: { codeVerifier, state },
  }
}

export async function startGoogleOAuth(authUrl: string): Promise<{ code: string; redirectUri: string }> {
  const response = await invoke<{ auth_url: string; redirect_uri: string }>('start_google_oauth', {
    authUrl,
  })

  const callback = await new Promise<{ code: string; state?: string; error?: string }>((resolve, reject) => {
    let cleanup: (() => void) | null = null
    let settled = false
    const timeout = window.setTimeout(() => {
      if (settled) return
      settled = true
      cleanup?.()
      reject(new Error('google authorization timed out'))
    }, 120000)

    function finish(fn: () => void) {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      cleanup?.()
      fn()
    }

    listen<{ code?: string; state?: string; error?: string }>('google-oauth-callback', event => {
      if (event.payload.error) {
        finish(() => reject(new Error(event.payload.error)))
        return
      }
      if (!event.payload.code) {
        finish(() => reject(new Error('missing authorization code')))
        return
      }
      finish(() => resolve({ code: event.payload.code as string, state: event.payload.state, error: event.payload.error }))
    }).then(unlisten => {
      cleanup = unlisten
      openUrl(response.auth_url).catch(error => finish(() => reject(error)))
    }).catch(error => finish(() => reject(error)))
  })

  return { code: callback.code, redirectUri: response.redirect_uri }
}

export async function exchangeGoogleCode(params: {
  clientId: string
  clientSecret?: string | null
  code: string
  codeVerifier: string
  redirectUri: string
}): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    code: params.code,
    code_verifier: params.codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: params.redirectUri,
  })

  if (params.clientSecret) {
    body.set('client_secret', params.clientSecret)
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(describeGoogleOAuthError(response.status, details))
  }

  return response.json()
}

export async function refreshGoogleAccessToken(account: GoogleAccount): Promise<GoogleTokenResponse> {
  if (!account.client_id || !account.refresh_token) {
    throw new Error('missing stored google credentials')
  }

  const body = new URLSearchParams({
    client_id: account.client_id,
    refresh_token: account.refresh_token,
    grant_type: 'refresh_token',
  })

  if (account.client_secret) {
    body.set('client_secret', account.client_secret)
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(details ? `token refresh failed (${response.status}): ${details}` : `token refresh failed (${response.status})`)
  }

  return response.json()
}
