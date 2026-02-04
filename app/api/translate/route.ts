import { NextResponse } from 'next/server';
import { translate } from 'google-translate-api-x';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { text, targetLang } = await request.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    // 1. Check local cache first
    try {
      const cachedTranslation = await prisma.translation.findUnique({
        where: {
          sourceText_targetLang: {
            sourceText: text,
            targetLang: targetLang,
          },
        },
      });

      if (cachedTranslation) {
        console.log(`Translation cache hit: "${text}" -> ${targetLang}`);
        return NextResponse.json({
          translatedText: cachedTranslation.translatedText,
          fromLang: 'local-cache',
          isCached: true
        });
      }
    } catch (dbError) {
      console.error('Database cache check failed:', dbError);
      // Fallback to API if DB fails
    }

    // 2. Map internal language codes to Google Translate codes
    let googleTargetLang = targetLang;
    if (targetLang === 'zh') {
      googleTargetLang = 'zh-CN';
    }

    console.log(`Translating via API: "${text}" to ${googleTargetLang} (original: ${targetLang})`);

    let translatedText = text;
    let fromLang = 'fallback';

    try {
      const res = await translate(text, { to: googleTargetLang, autoCorrect: true }) as { text: string; from?: { language?: { iso?: string } } } | { text: string; from?: { language?: { iso?: string } } }[];
      const single = Array.isArray(res) ? res[0] : res;
      translatedText = single?.text ?? String(text);
      fromLang = (single as { from?: { language?: { iso?: string } } })?.from?.language?.iso ?? 'unknown';
      console.log(`API Translation result: "${translatedText}" (detected: ${fromLang})`);
    } catch (apiError) {
      console.error('Translation API failed (using fallback):', apiError);
      // Fallback to original text, do not throw
    }

    // 3. Save to local cache (only if translation succeeded and is different)
    if (fromLang !== 'fallback' && translatedText !== text) {
      try {
        await prisma.translation.create({
          data: {
            sourceText: text,
            targetLang: targetLang,
            translatedText: translatedText,
          },
        });
        console.log('Saved translation to cache');
      } catch (saveError) {
        // Ignore unique constraint violations (race conditions)
        console.warn('Failed to save to cache (might exist):', saveError);
      }
    }

    return NextResponse.json({ 
      translatedText: translatedText,
      fromLang: fromLang,
      isCached: false
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    // Even in outer catch, try to return the original text if possible
    // (though parsing request.json might have failed, so we might not have 'text')
    return NextResponse.json(
      { error: 'Translation failed', details: error.message },
      { status: 500 }
    );
  }
}
