import { QRCodeSVG } from 'qrcode.react';
import { Clutch, Pairing, Gecko } from '../types';
import { formatDateDMY, getParentLineageDisplay } from '../lib/utils';

interface ClutchEggLabelProps {
  clutch: Clutch;
  pairing: Pairing;
  allGeckos?: Gecko[];
  id?: string;
  publicUrl?: string;
}

/**
 * ClutchEggLabel - Label Wadah Telur / Clutch Label (Ukuran 3.5 cm x 3 cm)
 * Sesuai instruksi:
 * - Garis abu-abu pemisah diposisikan PAS PERSIS DI TENGAH LABEL (50/50 split SIRE & DAM)
 * - SIRE ( ♂ ): Berada tepat dekat di bawah garis hitam atas
 * - DAM ( ♀ ): Berada sangat dekat tepat di bawah garis abu-abu pemisah tengah
 * - Kedua bagian memiliki ruang kosong lapang di bawah teks masing-masing untuk morph yang panjang
 * - EST HATCH: Dikosongkan, diberi titik-titik (..................) untuk tempat mengisi manual
 */
export function ClutchEggLabel({
  clutch,
  pairing,
  allGeckos = [],
  id = 'clutch-egg-label',
  publicUrl = typeof window !== 'undefined' ? window.location.origin : ''
}: ClutchEggLabelProps) {
  const sireInfo = getParentLineageDisplay('sire', pairing, allGeckos);
  const damInfo = getParentLineageDisplay('dam', pairing, allGeckos);

  // If in dev environment, replace -dev- with -pre- for QR code scan
  let qrOrigin = publicUrl;
  if (qrOrigin.includes('-dev-')) {
    qrOrigin = qrOrigin.replace('-dev-', '-pre-');
  }
  const qrTarget = `${qrOrigin}/incubator?clutchId=${clutch.id || ''}`;

  // Dynamic auto-scaling font sizes based on text length
  const sireClutchText = sireInfo.display || '-';
  const sireClutchFontSize = sireClutchText.length <= 22 ? '16px' : sireClutchText.length <= 36 ? '14.5px' : '13px';

  const damClutchText = damInfo.display || '-';
  const damClutchFontSize = damClutchText.length <= 22 ? '16px' : damClutchText.length <= 36 ? '14.5px' : '13px';

  return (
    <div
      id={id}
      className="bg-white text-black shrink-0 flex-none select-none overflow-hidden"
      style={{
        width: '350px',
        height: '300px',
        border: '2px solid #000000',
        padding: '12px 14px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
      }}
    >
      {/* 1. HEADER ROW: CLUTCH BADGE, EGG COUNT & LAY DATE */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 900,
              padding: '3px 9px',
              borderRadius: '5px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              lineHeight: 1.15
            }}
          >
            CLUTCH #{clutch.clutchNumber}
          </span>

          {clutch.eggCount > 0 && (
            <span
              style={{
                fontSize: '14px',
                fontWeight: 900,
                color: '#000000',
                letterSpacing: '0.02em'
              }}
            >
              {clutch.eggCount}E
            </span>
          )}

          {clutch.targetSex && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 900,
                color: '#000000',
                letterSpacing: '0.03em',
                textTransform: 'uppercase'
              }}
            >
              ({clutch.targetSex})
            </span>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              lineHeight: 1,
              marginBottom: '2px'
            }}
          >
            LAY DATE
          </div>
          <div
            style={{
              fontSize: '17px',
              fontWeight: 900,
              color: '#000000',
              lineHeight: 1.1,
              letterSpacing: '-0.01em'
            }}
          >
            {formatDateDMY(clutch.layDate) || '-'}
          </div>
        </div>
      </div>

      {/* HORIZONTAL BLACK DIVIDER */}
      <div
        style={{
          width: '100%',
          height: '1.5px',
          backgroundColor: '#000000',
          marginTop: '6px',
          marginBottom: '3px'
        }}
      />

      {/* 2. BODY: SIRE (50% ATAS) & DAM (50% BAWAH) DENGAN GARIS HITAM SOLID PAS DI TENGAH */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          boxSizing: 'border-box'
        }}
      >
        {/* UPPER HALF: SIRE (Tepat di bawah garis hitam atas) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            boxSizing: 'border-box',
            paddingTop: '2px',
            paddingBottom: '4px'
          }}
        >
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#000000',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: 1,
              marginBottom: '2px'
            }}
          >
            SIRE ( ♂ )
          </div>
          <div
            style={{
              marginTop: '4px',
              fontSize: sireClutchFontSize,
              fontWeight: 900,
              color: '#000000',
              textTransform: 'uppercase',
              lineHeight: 1.18,
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxHeight: '40px'
            }}
            title={sireInfo.display}
          >
            {sireClutchText}
          </div>
        </div>

        {/* SOLID BLACK DIVIDER LINE: PAS PERSIS DI TENGAH LABEL */}
        <div
          style={{
            width: '100%',
            height: '1.5px',
            backgroundColor: '#000000',
            flexShrink: 0
          }}
        />

        {/* LOWER HALF: DAM (Tepat dekat di bawah garis pemisah tengah) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            boxSizing: 'border-box',
            paddingTop: '3px',
            paddingBottom: '4px'
          }}
        >
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#000000',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: 1,
              marginBottom: '2px'
            }}
          >
            DAM ( ♀ )
          </div>
          <div
            style={{
              marginTop: '4px',
              width: '100%',
              fontSize: damClutchFontSize,
              fontWeight: 900,
              color: '#000000',
              textTransform: 'uppercase',
              lineHeight: 1.18,
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxHeight: '40px'
            }}
            title={damInfo.display}
          >
            {damClutchText}
          </div>
        </div>
      </div>

      {/* HORIZONTAL BLACK DIVIDER SEBELUM FOOTER */}
      <div
        style={{
          width: '100%',
          height: '1.5px',
          backgroundColor: '#000000',
          marginTop: '4px',
          marginBottom: '8px'
        }}
      />

      {/* 3. FOOTER: EST HATCH DENGAN TITIK-TITIK TEMPAT MENGISI & SQUARE MINI QR CODE */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          boxSizing: 'border-box',
          minHeight: '52px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              lineHeight: 1,
              marginBottom: '4px'
            }}
          >
            EST HATCH
          </div>
          <div
            style={{
              marginTop: '4px',
              fontSize: '16px',
              fontWeight: 900,
              color: '#000000',
              lineHeight: 1,
              letterSpacing: '0.12em'
            }}
          >
            ..................
          </div>
        </div>

        {/* SQUARE QR CODE WITH NEAT BLACK BORDER */}
        <div
          style={{
            padding: '2.5px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #000000',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}
        >
          <QRCodeSVG
            value={qrTarget}
            size={48}
            level="M"
            includeMargin={false}
          />
        </div>
      </div>
    </div>
  );
}
