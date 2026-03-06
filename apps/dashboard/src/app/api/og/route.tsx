import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: '#ffffff',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: '#2563eb',
          }}
        />

        {/* Logo / brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            P
          </div>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>
            ParseFlow
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: '800',
            color: '#0f172a',
            lineHeight: 1.1,
            marginBottom: '24px',
            maxWidth: '900px',
          }}
        >
          Invoice & Document Parser API
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: '28px',
            color: '#475569',
            marginBottom: '48px',
            maxWidth: '800px',
          }}
        >
          Upload a PDF or image. Get back structured JSON instantly.
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {['Free tier: 50 parses/mo', 'No credit card', 'REST API', '< 5 min setup'].map(
            (feat) => (
              <div
                key={feat}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: '#eff6ff',
                  border: '1.5px solid #bfdbfe',
                  borderRadius: '999px',
                  fontSize: '20px',
                  color: '#1d4ed8',
                  fontWeight: '600',
                }}
              >
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>+</span>
                {feat}
              </div>
            )
          )}
        </div>

        {/* URL */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            right: '80px',
            fontSize: '18px',
            color: '#94a3b8',
            fontWeight: '500',
          }}
        >
          parseflow-dashboard.vercel.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
