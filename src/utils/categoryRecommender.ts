import { Certificate, CategoryItem, CertificateCategory } from '../types';

export interface CategoryRecommendation {
  category: CertificateCategory;
  score: number; // 0 to 100
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  matchedKeywords: string[];
  similarCertificatesCount: number;
  matchedIssuers: string[];
}

export interface CandidateCertificateMetadata {
  title?: string;
  issuer?: string;
  recipientName?: string;
  description?: string;
  tags?: string[];
  fileName?: string;
  extractedTextSummary?: string;
}

// Built-in Indonesian domain keywords dictionary for fallback and semantic reinforcement
const DOMAIN_CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Pelatihan': [
    'pelatihan', 'diklat', 'training', 'kursus', 'bhd', 'btcls', 'acls', 'atls', 'icu',
    'kritis', 'keperawatan', 'bedah', 'hipkabi', 'ppi', 'kompetensi', 'sertifikasi',
    'auditor', 'audit', 'iso 27001', 'iso', 'resusitasi', 'jantung', 'gawat darurat',
    'inhouse', 'outhouse', 'klinis', 'medis', 'sterilisasi', 'cssd', 'anestesi', 'farmasi'
  ],
  'Workshop': [
    'workshop', 'seminar', 'webinar', 'simposium', 'lokakarya', 'simrs', 'rme',
    'rekam medis', 'konferensi', 'talkshow', 'desain', 'design system', 'figma',
    'ui/ux', 'kuliah umum', 'panel diskusi', 'hands on', 'masterclass', 'bootcamp'
  ],
  'Prestasi': [
    'prestasi', 'juara', 'lomba', 'pemenang', 'best', 'champion', 'kompetisi',
    'juara 1', 'juara 2', 'juara 3', 'juara i', 'juara ii', 'juara iii', 'medali',
    'emas', 'perak', 'perunggu', 'terbaik', 'first place', 'hackathon', 'olimpiade',
    'kontes', 'sayembara', 'kejuaraan', 'unggul'
  ],
  'Akademik': [
    'akademik', 'ijazah', 'diploma', 'sarjana', 'magister', 'doktor', 'transkrip',
    'universitas', 'institut', 'fakultas', 'wisuda', 'stikes', 'poltekkes',
    'ipk', 'yudisium', 'kuliah', 'pendidikan formal', 's1', 's2', 's3', 'd3', 'd4'
  ],
  'Penghargaan': [
    'penghargaan', 'tanda kehormatan', 'award', 'apresiasi', 'satya lancana',
    'pengabdian', 'bintang jasa', 'kehormatan', 'loyalitas', 'teladan', 'dedikasi',
    'pegawai berprestasi', 'tokoh', 'ucapan terima kasih', 'piagam penghargaan'
  ],
  'Kelulusan': [
    'kelulusan', 'lulus', 'surat tanda tamat', 'sttpp', 'uji kompetensi', 'ukom',
    'lulusan', 'kelulusan ujian', 'passed', 'tamat', 'surat izin praktik', 'sip', 'str'
  ],
  'Lainnya': [
    'dokumen', 'surat', 'keterangan', 'sertifikat', 'arsip', 'umum', 'berkas'
  ]
};

// Helper: Tokenize string into lowercase alphanumeric words
function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

/**
 * Intelligent Category Recommender Engine
 * Analyzes existing certificate metadata (historical titles, issuers, tags, descriptions)
 * to predict and rank the most accurate categories for incoming uploads.
 */
export function recommendCategoriesFromMetadata(
  candidate: CandidateCertificateMetadata,
  existingCertificates: Certificate[] = [],
  availableCategories: string[] = []
): CategoryRecommendation[] {
  // Combine all candidate texts
  const candidateTitle = (candidate.title || '').trim();
  const candidateIssuer = (candidate.issuer || '').trim();
  const candidateFileName = (candidate.fileName || '').trim();
  const candidateDesc = (candidate.description || '').trim();
  const candidateExtracted = (candidate.extractedTextSummary || '').trim();
  const candidateTags = candidate.tags || [];

  const combinedCandidateText = [
    candidateTitle,
    candidateIssuer,
    candidateFileName,
    candidateDesc,
    candidateExtracted,
    ...candidateTags
  ].join(' ').toLowerCase();

  const candidateTokens = new Set(tokenize(combinedCandidateText));
  const candidateIssuerLower = candidateIssuer.toLowerCase();

  // If no available categories provided, infer from existing certs or defaults
  const categoriesToEvaluate = new Set<string>();
  if (availableCategories.length > 0) {
    availableCategories.forEach(c => categoriesToEvaluate.add(c.trim()));
  } else {
    ['Pelatihan', 'Workshop', 'Prestasi', 'Akademik', 'Penghargaan', 'Kelulusan', 'Lainnya'].forEach(c => categoriesToEvaluate.add(c));
  }
  existingCertificates.forEach(c => {
    if (c.category) categoriesToEvaluate.add(c.category.trim());
  });

  const categoriesList = Array.from(categoriesToEvaluate).filter(Boolean);

  // Group existing certificates by category for metadata profiling
  const categoryProfiles: Record<string, {
    count: number;
    titles: string[];
    issuers: Map<string, number>; // issuer name -> count
    tags: Map<string, number>; // tag name -> count
    tokens: Map<string, number>; // token -> count
    totalWords: number;
  }> = {};

  categoriesList.forEach(cat => {
    categoryProfiles[cat] = {
      count: 0,
      titles: [],
      issuers: new Map(),
      tags: new Map(),
      tokens: new Map(),
      totalWords: 0
    };
  });

  existingCertificates.forEach(cert => {
    const cat = cert.category || 'Lainnya';
    if (!categoryProfiles[cat]) {
      categoryProfiles[cat] = {
        count: 0,
        titles: [],
        issuers: new Map(),
        tags: new Map(),
        tokens: new Map(),
        totalWords: 0
      };
    }

    const profile = categoryProfiles[cat];
    profile.count += 1;
    if (cert.title) profile.titles.push(cert.title);

    // Profile issuer
    if (cert.issuer) {
      const iss = cert.issuer.trim();
      profile.issuers.set(iss, (profile.issuers.get(iss) || 0) + 1);
    }

    // Profile tags
    if (Array.isArray(cert.tags)) {
      cert.tags.forEach(t => {
        const tag = t.trim();
        profile.tags.set(tag, (profile.tags.get(tag) || 0) + 1);
      });
    }

    // Profile tokens from title, description, and tags
    const certTokens = tokenize(`${cert.title} ${cert.description || ''} ${cert.tags?.join(' ') || ''}`);
    certTokens.forEach(token => {
      profile.tokens.set(token, (profile.tokens.get(token) || 0) + 1);
      profile.totalWords += 1;
    });
  });

  const recommendations: CategoryRecommendation[] = [];

  // Calculate score for each category
  categoriesList.forEach(category => {
    const profile = categoryProfiles[category] || {
      count: 0,
      titles: [],
      issuers: new Map(),
      tags: new Map(),
      tokens: new Map(),
      totalWords: 0
    };

    let rawScore = 0;
    const reasons: string[] = [];
    const matchedKeywords: string[] = [];
    const matchedIssuers: string[] = [];
    let similarCertificatesCount = 0;

    // 1. ISSUER MATCHING (Historical Metadata Correlation: Max 35 pts)
    if (candidateIssuerLower && profile.issuers.size > 0) {
      let bestIssuerMatchRatio = 0;
      let matchingIssuerName = '';
      let matchingIssuerCertCount = 0;

      for (const [histIssuer, histCount] of profile.issuers.entries()) {
        const histLower = histIssuer.toLowerCase();
        if (histLower === candidateIssuerLower) {
          bestIssuerMatchRatio = 1.0;
          matchingIssuerName = histIssuer;
          matchingIssuerCertCount = histCount;
          break;
        } else if (histLower.includes(candidateIssuerLower) || candidateIssuerLower.includes(histLower)) {
          if (0.8 > bestIssuerMatchRatio) {
            bestIssuerMatchRatio = 0.8;
            matchingIssuerName = histIssuer;
            matchingIssuerCertCount = histCount;
          }
        }
      }

      if (bestIssuerMatchRatio > 0) {
        const issuerPoints = Math.round(35 * bestIssuerMatchRatio);
        rawScore += issuerPoints;
        matchedIssuers.push(matchingIssuerName);
        reasons.push(`Penerbit "${matchingIssuerName}" sering dikaitkan dengan kategori ini (${matchingIssuerCertCount} sertifikat sebelumnya)`);
      }
    }

    // 2. TITLE & TOKEN CO-OCCURRENCE IN HISTORICAL METADATA (Max 35 pts)
    if (candidateTokens.size > 0 && profile.tokens.size > 0) {
      let matchedTokenCount = 0;
      let weightedTokenScore = 0;

      for (const token of candidateTokens) {
        const freqInCat = profile.tokens.get(token) || 0;
        if (freqInCat > 0) {
          matchedTokenCount += 1;
          matchedKeywords.push(token);
          // Frequency weighting
          weightedTokenScore += Math.min(freqInCat * 3, 12);
        }
      }

      // Check for exact/near title matches in this category
      if (candidateTitle) {
        const candidateTitleLower = candidateTitle.toLowerCase();
        profile.titles.forEach(t => {
          const tLower = t.toLowerCase();
          if (tLower === candidateTitleLower) {
            rawScore += 20;
            similarCertificatesCount += 1;
          } else if (tLower.includes(candidateTitleLower) || candidateTitleLower.includes(tLower)) {
            rawScore += 12;
            similarCertificatesCount += 1;
          }
        });
      }

      const tokenScore = Math.min(Math.round(weightedTokenScore + matchedTokenCount * 4), 35);
      rawScore += tokenScore;

      if (matchedKeywords.length > 0 && profile.count > 0) {
        const topKeywords = matchedKeywords.slice(0, 4).join(', ');
        reasons.push(`Kata kunci arsip cocok: "${topKeywords}"`);
      }
    }

    // 3. TAG OVERLAP (Max 20 pts)
    if (candidateTags.length > 0 && profile.tags.size > 0) {
      let tagOverlap = 0;
      candidateTags.forEach(t => {
        const tLower = t.toLowerCase().trim();
        for (const [histTag, count] of profile.tags.entries()) {
          if (histTag.toLowerCase() === tLower) {
            tagOverlap += Math.min(count * 4, 10);
            matchedKeywords.push(histTag);
          }
        }
      });
      const tagScore = Math.min(tagOverlap, 20);
      rawScore += tagScore;
      if (tagScore > 0) {
        reasons.push(`Tag sesuai dengan riwayat arsip kategori`);
      }
    }

    // 4. DOMAIN VOCABULARY & HEURISTIC FALLBACK (Max 25 pts)
    const domainKeywords = DOMAIN_CATEGORY_KEYWORDS[category] || [];
    const directCategoryNameMatches = combinedCandidateText.includes(category.toLowerCase());
    
    if (directCategoryNameMatches) {
      rawScore += 22;
      matchedKeywords.push(category.toLowerCase());
      reasons.push(`Nama kategori tertera secara eksplisit dalam judul/nama berkas`);
    }

    let domainMatches = 0;
    domainKeywords.forEach(dk => {
      if (combinedCandidateText.includes(dk.toLowerCase())) {
        domainMatches += 1;
        if (!matchedKeywords.includes(dk)) {
          matchedKeywords.push(dk);
        }
      }
    });

    if (domainMatches > 0) {
      const domainScore = Math.min(domainMatches * 6, 25);
      rawScore += domainScore;
      if (!directCategoryNameMatches && reasons.length === 0) {
        reasons.push(`Kecocokan istilah teknis & standar diklat (${matchedKeywords.slice(0, 3).join(', ')})`);
      }
    }

    // 5. HISTORICAL POPULARITY WEIGHTING (Baseline 2 - 5 pts)
    if (profile.count > 0) {
      rawScore += Math.min(profile.count * 1.5, 6);
    }

    // Normalize final percentage score (10 - 99%)
    let finalScore = Math.min(Math.max(Math.round(rawScore), 5), 99);

    // If there is strong evidence (direct name match or high keyword overlap), ensure >= 75%
    if (directCategoryNameMatches || (matchedKeywords.length >= 3 && matchedIssuers.length > 0)) {
      finalScore = Math.max(finalScore, 82);
    }

    // Assign confidence
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (finalScore >= 70) {
      confidence = 'high';
    } else if (finalScore >= 40) {
      confidence = 'medium';
    }

    // Clean unique matched keywords & reasons
    const uniqueMatchedKeywords = Array.from(new Set(matchedKeywords));
    const uniqueReasons = Array.from(new Set(reasons));

    if (uniqueReasons.length === 0) {
      if (profile.count > 0) {
        uniqueReasons.push(`Berdasarkan frekuensi umum pada arsip (${profile.count} dokumen)`);
      } else {
        uniqueReasons.push(`Sesuai standar klasifikasi dokumen sertifikat`);
      }
    }

    recommendations.push({
      category,
      score: finalScore,
      confidence,
      reasons: uniqueReasons,
      matchedKeywords: uniqueMatchedKeywords,
      similarCertificatesCount: Math.max(similarCertificatesCount, profile.count > 0 && finalScore > 50 ? Math.min(profile.count, 5) : 0),
      matchedIssuers: Array.from(new Set(matchedIssuers))
    });
  });

  // Sort descending by score
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations;
}

/**
 * Get top recommended category and alternative runner-ups
 */
export function getTopCategoryRecommendation(
  candidate: CandidateCertificateMetadata,
  existingCertificates: Certificate[] = [],
  availableCategories: string[] = []
): {
  bestMatch: CategoryRecommendation | null;
  allRecommendations: CategoryRecommendation[];
  top3: CategoryRecommendation[];
} {
  const all = recommendCategoriesFromMetadata(candidate, existingCertificates, availableCategories);
  const bestMatch = all.length > 0 ? all[0] : null;
  const top3 = all.slice(0, 3);

  return {
    bestMatch,
    allRecommendations: all,
    top3
  };
}
