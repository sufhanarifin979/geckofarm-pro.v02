import { QRCodeSVG } from 'qrcode.react';
import { Gecko, UserProfile } from '../types';
import { formatDateDMY, getParentLineageDisplay } from '../lib/utils';

interface GeckoIdLabelProps {
  gecko: Gecko;
  allGeckos?: Gecko[];
  profile: UserProfile | null;
  id?: string;
  publicUrl?: string;
}

/**
 * GeckoIdLabel - EXACT 100% REPLICA OF USER REFERENCE IMAGE
 * 
 * Strict specifications:
 * - 2 columns: left 40%, right 60%
 * - No extra whitespace, tight spacing throughout, height perfectly filled
 * - Separator lines: tight 4px above line, ~12px below line
 * - Left column all centered (SCAN TO VERIFY, QR box, NAME / ID, Name)
 * - Right column all left-aligned (GENETIC MORPH, SIRE, DAM, HATCH DATE & STRAIN)
 * - All value text: bold uppercase black, allowing 2-line wrapping
 * - All label text: small light gray uppercase
 * - Bottom horizontal line: thin gray (#b2b9c3)
 * - Footer: Left = bold uppercase Farm Name, Right = solid black pill Gender Badge with white text
 */
export function GeckoIdLabel({
  gecko,
  allGeckos = [],
  profile,
  id,
  publicUrl = typeof window !== 'undefined' ? window.location.origin : ''
}: GeckoIdLabelProps) {
  const sireInfo = getParentLineageDisplay('sire', gecko, allGeckos);
  const damInfo = getParentLineageDisplay('dam', gecko, allGeckos);

  const farmName = profile?.farmName || 'KINGS GECKO';
  const qrTarget = `${publicUrl}/v/${gecko.id || ''}`;
  const genderText = (gecko.gender || 'MALE').toUpperCase();

  return (
    <div
      id={id}
      className="bg-white text-black shrink-0 flex-none select-none overflow-hidden"
      style={{
        width: '540px',
        height: '360px',
        boxSizing: 'border-box',
        padding: '14px 18px 12px 18px',
        border: '3px solid #000000',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
      }}
    >
      {/* TOP AREA: 2 COLUMNS (LEFT 200px, RIGHT REMAINDER) */}
      <div 
        style={{
          display: 'flex',
          width: '100%',
          height: '276px',
          boxSizing: 'border-box'
        }}
      >
        {/* LEFT COLUMN: FIXED 200PX - ALL CENTERED & SEJAJAR DENGAN RIGHT COLUMN */}
        <div
          style={{
            width: '200px',
            flex: '0 0 200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: 'center',
            paddingRight: '14px',
            boxSizing: 'border-box',
            height: '100%',
            paddingTop: '6px'
          }}
        >
          {/* SCAN TO VERIFY */}
          <div
            style={{
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '0.07em',
              lineHeight: '14px',
              height: '14px',
              color: '#000000',
              textAlign: 'center',
              textTransform: 'uppercase'
            }}
          >
            SCAN TO VERIFY
          </div>

          {/* QR CODE BOX (SOLID BLACK 2.5PX OUTLINE) */}
          <div
            style={{
              width: '176px',
              height: '176px',
              border: '2.5px solid #000000',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            <QRCodeSVG
              value={qrTarget}
              size={164}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* NAME / ID LABEL & VALUE (SEJAJAR PERSIS DENGAN HATCH DATE & STRAIN) */}
          <div
            style={{
              width: '100%',
              height: '48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#8c939e',
                letterSpacing: '0.06em',
                lineHeight: '14px',
                height: '14px',
                textTransform: 'uppercase',
                marginBottom: '2px'
              }}
            >
              NAME / ID
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 900,
                color: '#000000',
                lineHeight: '1.2',
                textTransform: 'uppercase',
                width: '100%',
                wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginTop: '5px'
              }}
            >
              {gecko.name || 'TURBO'}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FIXED SLOTS SO LINES & POSITIONS NEVER MOVE REGARDLESS OF TEXT LENGTH */}
        <div
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingLeft: '6px',
            boxSizing: 'border-box',
            height: '100%',
            paddingTop: '6px'
          }}
        >
          {/* SECTION 1: GENETIC MORPH (FIXED 63PX SLOT) */}
          <div
            style={{
              width: '100%',
              height: '63px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#8c939e',
                  letterSpacing: '0.06em',
                  lineHeight: '14px',
                  height: '14px',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}
              >
                GENETIC MORPH
              </div>
              <div
                style={{
                  width: '100%',
                  fontSize: '13.5px',
                  fontWeight: 900,
                  color: '#000000',
                  lineHeight: '1.22',
                  textTransform: 'uppercase',
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  height: '34px',
                  marginTop: '10px'
                }}
              >
                {gecko.morph || '-'}
              </div>
            </div>
            <div style={{ width: '100%', height: '1.5px', backgroundColor: '#000000', flexShrink: 0 }} />
          </div>

          {/* SECTION 2: SIRE (FIXED 63PX SLOT) */}
          <div
            style={{
              width: '100%',
              height: '63px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#8c939e',
                  letterSpacing: '0.06em',
                  lineHeight: '14px',
                  height: '14px',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}
              >
                SIRE
              </div>
              <div
                style={{
                  width: '100%',
                  fontSize: '13.5px',
                  fontWeight: 900,
                  color: '#000000',
                  lineHeight: '1.22',
                  textTransform: 'uppercase',
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  height: '34px',
                  marginTop: '10px'
                }}
              >
                {sireInfo.display || '-'}
              </div>
            </div>
            <div style={{ width: '100%', height: '1.5px', backgroundColor: '#000000', flexShrink: 0 }} />
          </div>

          {/* SECTION 3: DAM (FIXED 63PX SLOT) */}
          <div
            style={{
              width: '100%',
              height: '63px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box'
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#8c939e',
                  letterSpacing: '0.06em',
                  lineHeight: '14px',
                  height: '14px',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}
              >
                DAM
              </div>
              <div
                style={{
                  width: '100%',
                  fontSize: '13.5px',
                  fontWeight: 900,
                  color: '#000000',
                  lineHeight: '1.22',
                  textTransform: 'uppercase',
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  height: '34px',
                  marginTop: '10px'
                }}
              >
                {damInfo.display || '-'}
              </div>
            </div>
            <div style={{ width: '100%', height: '1.5px', backgroundColor: '#000000', flexShrink: 0 }} />
          </div>

          {/* SECTION 4: HATCH DATE & STRAIN (FIXED 48PX SLOT, PERFECTLY ALIGNED WITH NAME / ID) */}
          <div
            style={{
              width: '100%',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box'
            }}
          >
            {/* SUB-COL 1: HATCH DATE */}
            <div
              style={{
                flex: '1 1 0',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                paddingRight: '12px',
                boxSizing: 'border-box',
                height: '100%',
                justifyContent: 'flex-start'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#8c939e',
                  letterSpacing: '0.06em',
                  lineHeight: '14px',
                  height: '14px',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}
              >
                HATCH DATE
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#000000',
                  lineHeight: '1.2',
                  textTransform: 'uppercase',
                  marginTop: '5px'
                }}
              >
                {formatDateDMY(gecko.birthDate) || '-'}
              </div>
            </div>

            {/* VERTICAL DIVIDER LINE: EXACT CENTER, CLEANLY CONTAINED WITHOUT CUTTING ANY OTHER LINES */}
            <div
              style={{
                width: '1.5px',
                height: '32px',
                backgroundColor: '#000000',
                flexShrink: 0,
                alignSelf: 'center'
              }}
            />

            {/* SUB-COL 2: STRAIN */}
            <div
              style={{
                flex: '1 1 0',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                paddingLeft: '12px',
                boxSizing: 'border-box',
                height: '100%',
                justifyContent: 'flex-start'
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#8c939e',
                  letterSpacing: '0.06em',
                  lineHeight: '14px',
                  height: '14px',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}
              >
                STRAIN
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#000000',
                  lineHeight: '1.2',
                  textTransform: 'uppercase',
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginTop: '5px'
                }}
              >
                {gecko.albinoStrain || 'TREMPER'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM HORIZONTAL LINE: SOLID BLACK (#000000) */}
      <div
        style={{
          width: '100%',
          borderTop: '1.5px solid #000000',
          paddingTop: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          height: '38px'
        }}
      >
        {/* LEFT: FARM NAME (BOLD UPPERCASE BLACK) */}
        <div
          style={{
            fontSize: '19px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            color: '#000000',
            maxWidth: '340px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {farmName}
        </div>

        {/* RIGHT: GENDER BADGE (ROUNDED SOLID BLACK BADGE, WHITE BOLD TEXT) */}
        <div
          style={{
            backgroundColor: '#000000',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 900,
            letterSpacing: '0.06em',
            padding: '3px 18px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '1.2'
          }}
        >
          {genderText}
        </div>
      </div>
    </div>
  );
}
