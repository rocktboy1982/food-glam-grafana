'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/* ─── Region metadata ──────────────────────────────────────────────────── */
interface RegionInfo {
  id: string
  label: string
  emoji: string
  description: string
  color: string
  glowColor: string
  recipeCount: number
}

const REGIONS: RegionInfo[] = [
  { id: 'north-america',   label: 'North America',              emoji: '🍔', description: 'American BBQ, Canadian poutine, Mexican street food',          color: '#c84b31', glowColor: 'rgba(200,75,49,0.7)',   recipeCount: 128 },
  { id: 'south-america',   label: 'South America',              emoji: '🌮', description: 'Peruvian ceviche, Brazilian churrasco, Argentine asado',        color: '#e8a838', glowColor: 'rgba(232,168,56,0.7)',  recipeCount: 94  },
  { id: 'western-europe',  label: 'Western Europe',             emoji: '🥖', description: "France, Italy, Spain — Europe's culinary heartland",            color: '#4c7ef3', glowColor: 'rgba(76,126,243,0.7)',  recipeCount: 215 },
  { id: 'northern-europe', label: 'Northern Europe',            emoji: '🐟', description: 'Scandinavian smokehouse, Baltic rye, Nordic foraging',          color: '#5bb8d4', glowColor: 'rgba(91,184,212,0.7)',  recipeCount: 67  },
  { id: 'eastern-europe',  label: 'Eastern Europe',             emoji: '🥟', description: 'Polish pierogi, Romanian mămăligă, Georgian khinkali',          color: '#7c5cbf', glowColor: 'rgba(124,92,191,0.7)',  recipeCount: 88  },
  { id: 'north-africa',    label: 'North Africa',               emoji: '🏺', description: 'Moroccan tagine, Egyptian ful, Tunisian harissa',               color: '#d4a853', glowColor: 'rgba(212,168,83,0.7)',  recipeCount: 76  },
  { id: 'west-africa',     label: 'West Africa',                emoji: '🫙', description: 'Nigerian stews, Ghanaian jollof, Senegalese thiéboudienne',      color: '#c87941', glowColor: 'rgba(200,121,65,0.7)',  recipeCount: 52  },
  { id: 'east-africa',     label: 'East Africa',                emoji: '☕', description: 'Ethiopian injera, Kenyan nyama choma, Zanzibar spices',          color: '#5da05d', glowColor: 'rgba(93,160,93,0.7)',   recipeCount: 44  },
  { id: 'southern-africa', label: 'Southern Africa',            emoji: '🔥', description: 'South African braai, Zimbabwean sadza, Malagasy romazava',       color: '#c85e5e', glowColor: 'rgba(200,94,94,0.7)',   recipeCount: 38  },
  { id: 'middle-east',     label: 'Middle East',                emoji: '🧆', description: 'Levantine mezze, Persian rice, Arabian spices',                  color: '#d4875c', glowColor: 'rgba(212,135,92,0.7)',  recipeCount: 109 },
  { id: 'central-asia',    label: 'Central Asia & Caucasus',   emoji: '🏔️', description: 'Silk Road flavours from Georgia to Kazakhstan',                 color: '#9e7bb5', glowColor: 'rgba(158,123,181,0.7)', recipeCount: 41  },
  { id: 'south-asia',      label: 'South Asia',                 emoji: '🍛', description: 'India, Pakistan, Bangladesh — spice-rich subcontinent',         color: '#d45f8c', glowColor: 'rgba(212,95,140,0.7)',  recipeCount: 183 },
  { id: 'east-asia',       label: 'East Asia',                  emoji: '🍜', description: 'China, Japan, Korea — ancient culinary traditions',             color: '#e84040', glowColor: 'rgba(232,64,64,0.7)',   recipeCount: 247 },
  { id: 'southeast-asia',  label: 'Southeast Asia',             emoji: '🌴', description: 'Thailand, Vietnam, Indonesia — tropical flavours',              color: '#3dab6e', glowColor: 'rgba(61,171,110,0.7)',  recipeCount: 142 },
  { id: 'oceania',         label: 'Oceania',                    emoji: '🦘', description: "Australian BBQ, Māori hāngī, Pacific Island feasts",            color: '#4badb5', glowColor: 'rgba(75,173,181,0.7)',  recipeCount: 33  },
]

const regionById = Object.fromEntries(REGIONS.map(r => [r.id, r]))

/* ─── SVG path data (Natural Earth simplified, viewBox 0 0 960 500) ──── */
/* Each region groups multiple country paths together                      */

const REGION_PATHS: Record<string, string> = {

  /* ── North America ── */
  'north-america': `
    M 185,52 L 195,48 L 210,50 L 218,45 L 228,48 L 235,44 L 248,46 L 255,52 L 260,50 L 268,55
    L 272,52 L 280,54 L 286,60 L 288,67 L 285,74 L 290,80 L 295,78 L 300,82 L 298,88 L 292,92
    L 286,96 L 280,100 L 275,108 L 270,115 L 265,122 L 260,130 L 255,138 L 250,145 L 248,152
    L 244,158 L 238,162 L 232,168 L 226,172 L 220,178 L 215,185 L 210,192 L 205,198 L 198,204
    L 192,208 L 185,212 L 178,216 L 172,222 L 166,226 L 160,230 L 155,236 L 150,240 L 144,244
    L 138,248 L 132,250 L 126,252 L 120,255 L 115,258 L 112,264 L 116,270 L 120,274 L 124,278
    L 128,282 L 132,286 L 136,289 L 140,292 L 144,296 L 148,300 L 152,303 L 148,306 L 144,310
    L 140,313 L 136,316 L 132,318 L 128,320 L 124,322 L 120,325 L 116,328 L 113,332 L 110,336
    L 108,340 L 106,345 L 104,350 L 105,354 L 108,356 L 112,357 L 116,355 L 120,352 L 125,349
    L 130,346 L 134,342 L 138,338 L 142,334 L 146,330 L 150,326 L 155,322 L 160,318 L 165,314
    L 170,310 L 175,306 L 180,302 L 185,298 L 188,294 L 190,288 L 192,282 L 195,276 L 200,272
    L 205,268 L 210,264 L 215,260 L 220,256 L 225,252 L 230,248 L 234,244 L 238,240 L 242,236
    L 246,232 L 250,228 L 254,224 L 258,220 L 262,216 L 266,212 L 270,208 L 274,204 L 278,200
    L 282,196 L 286,192 L 289,188 L 292,184 L 294,180 L 296,176 L 298,172 L 300,168 L 302,164
    L 303,160 L 304,156 L 305,152 L 304,148 L 302,144 L 300,140 L 298,136 L 296,132 L 294,128
    L 292,124 L 290,120 L 288,116 L 286,112 L 284,108 L 282,104 L 280,100 L 278,96 L 276,92
    L 274,88 L 272,84 L 270,80 L 268,76 L 266,72 L 264,68 L 262,64 L 260,60 L 258,56 L 256,52
    L 254,48 L 252,44 L 250,40 L 248,36 L 246,32 L 244,28 L 242,24 L 240,20 L 238,18 L 235,16
    L 232,15 L 228,15 L 224,16 L 220,18 L 216,20 L 212,22 L 208,24 L 204,27 L 200,30 L 196,33
    L 192,36 L 188,40 L 185,44 L 183,48 Z
    M 145,52 L 155,48 L 162,50 L 168,54 L 172,58 L 174,64 L 172,70 L 168,74 L 162,76 L 156,74
    L 150,70 L 146,64 L 144,58 Z
  `,

  /* ── South America ── */
  'south-america': `
    M 195,310 L 202,305 L 210,302 L 218,300 L 225,298 L 232,297 L 238,298 L 244,300 L 250,304
    L 256,308 L 261,313 L 265,318 L 268,325 L 270,332 L 271,340 L 270,348 L 268,356 L 265,364
    L 261,372 L 257,380 L 252,387 L 247,394 L 241,400 L 235,405 L 229,409 L 223,412 L 217,414
    L 211,415 L 205,414 L 200,412 L 196,409 L 192,405 L 189,400 L 187,394 L 186,388 L 186,382
    L 187,376 L 189,370 L 192,364 L 195,358 L 198,352 L 200,346 L 202,340 L 203,334 L 203,328
    L 202,322 L 200,316 Z
    M 210,302 L 220,298 L 230,296 L 240,298 L 248,302 L 255,308 L 260,315 L 264,322 L 267,330
    L 269,338 L 269,346 L 268,354 L 265,362 L 260,369 L 254,375 L 248,380 L 242,384 L 235,387
    L 228,388 L 221,388 L 215,387 L 209,384 L 204,380 L 200,375 L 197,369 L 195,362 L 194,355
    L 194,348 L 195,341 L 197,334 L 200,327 L 204,321 L 208,315 Z
    M 232,388 L 240,392 L 248,396 L 255,400 L 260,406 L 263,412 L 264,418 L 263,424 L 260,430
    L 256,435 L 250,439 L 244,442 L 237,443 L 230,442 L 224,439 L 219,434 L 216,428 L 215,422
    L 216,416 L 219,410 L 223,404 L 228,398 Z
  `,

  /* ── Western Europe ── */
  'western-europe': `
    M 430,98 L 436,94 L 442,92 L 448,93 L 454,96 L 459,100 L 462,105 L 463,110 L 461,115
    L 457,119 L 452,122 L 446,124 L 440,123 L 435,120 L 431,115 L 429,109 L 429,103 Z
    M 448,122 L 454,118 L 460,116 L 466,116 L 472,118 L 477,122 L 480,127 L 481,133 L 479,139
    L 475,144 L 469,147 L 463,148 L 457,147 L 452,143 L 449,138 L 448,132 Z
    M 460,148 L 468,145 L 476,144 L 484,145 L 491,148 L 496,153 L 499,160 L 499,167 L 497,173
    L 492,178 L 486,181 L 479,182 L 472,181 L 466,178 L 461,173 L 458,167 L 457,160 L 458,153 Z
    M 480,145 L 488,142 L 496,141 L 504,143 L 511,147 L 516,153 L 518,160 L 517,167 L 513,173
    L 507,177 L 500,179 L 493,178 L 487,174 L 483,168 L 481,161 L 481,154 Z
    M 424,130 L 432,126 L 440,124 L 448,124 L 455,127 L 460,132 L 462,138 L 461,144 L 458,149
    L 452,153 L 446,155 L 439,154 L 433,151 L 428,145 L 425,139 L 424,133 Z
    M 416,155 L 424,151 L 432,150 L 440,151 L 447,154 L 452,159 L 454,165 L 453,171 L 450,176
    L 444,180 L 437,182 L 430,181 L 424,178 L 419,172 L 417,166 L 416,159 Z
    M 505,155 L 513,152 L 521,151 L 529,153 L 535,157 L 539,163 L 540,170 L 538,176 L 534,181
    L 528,184 L 521,185 L 514,183 L 509,179 L 506,173 L 505,166 Z
    M 504,183 L 512,180 L 520,179 L 528,181 L 534,185 L 537,191 L 537,198 L 534,204 L 529,208
    L 522,210 L 515,209 L 509,205 L 505,199 L 504,192 Z
    M 440,180 L 448,178 L 456,178 L 463,181 L 468,186 L 470,192 L 469,199 L 466,205 L 461,209
    L 455,211 L 448,210 L 442,207 L 437,202 L 436,195 L 437,188 Z
    M 450,210 L 458,208 L 466,208 L 473,211 L 478,216 L 479,223 L 477,229 L 473,234 L 467,237
    L 460,238 L 453,236 L 448,232 L 446,226 L 447,219 L 450,213 Z
  `,

  /* ── Northern Europe ── */
  'northern-europe': `
    M 460,52 L 468,48 L 476,46 L 484,47 L 491,50 L 496,55 L 498,61 L 497,67 L 493,72 L 487,75
    L 480,76 L 473,75 L 467,71 L 463,65 L 461,59 Z
    M 476,46 L 484,42 L 492,40 L 500,41 L 507,44 L 511,50 L 512,56 L 510,62 L 505,66 L 499,68
    L 492,67 L 487,63 L 484,57 L 483,51 Z
    M 500,42 L 508,38 L 516,36 L 524,37 L 530,41 L 534,47 L 534,54 L 531,60 L 526,64 L 519,66
    L 512,65 L 507,61 L 505,55 L 505,48 Z
    M 488,76 L 496,73 L 504,72 L 512,74 L 518,78 L 521,84 L 520,90 L 516,95 L 510,98 L 503,99
    L 496,97 L 491,92 L 489,86 Z
    M 434,56 L 442,52 L 450,50 L 458,51 L 464,55 L 467,61 L 466,67 L 462,72 L 456,75 L 449,76
    L 442,74 L 437,69 L 435,63 Z
    M 448,76 L 456,73 L 464,72 L 472,74 L 477,79 L 478,85 L 476,91 L 471,95 L 465,97 L 458,96
    L 452,92 L 449,86 Z
    M 472,96 L 480,93 L 488,92 L 496,94 L 501,99 L 502,106 L 499,112 L 494,116 L 487,117 L 480,115
    L 474,110 L 472,104 Z
    M 530,62 L 538,58 L 546,57 L 554,59 L 559,64 L 560,71 L 558,77 L 553,81 L 547,82 L 540,80
    L 535,75 L 533,69 Z
  `,

  /* ── Eastern Europe ── */
  'eastern-europe': `
    M 518,100 L 526,96 L 534,95 L 542,97 L 548,102 L 550,109 L 548,115 L 543,119 L 537,121
    L 530,120 L 524,116 L 521,110 Z
    M 536,120 L 544,117 L 552,116 L 560,118 L 566,123 L 568,130 L 566,136 L 561,140 L 555,142
    L 548,141 L 542,137 L 539,131 Z
    M 520,122 L 528,119 L 536,118 L 544,120 L 549,125 L 550,132 L 548,138 L 543,142 L 537,144
    L 530,143 L 524,139 L 521,133 Z
    M 504,140 L 512,137 L 520,136 L 528,138 L 533,143 L 534,150 L 532,156 L 527,160 L 521,162
    L 514,161 L 508,157 L 505,151 Z
    M 522,142 L 530,139 L 538,138 L 546,140 L 551,145 L 552,152 L 550,158 L 545,162 L 539,164
    L 532,163 L 526,159 L 523,153 Z
    M 540,140 L 548,137 L 556,136 L 564,138 L 569,143 L 570,150 L 568,156 L 563,160 L 557,162
    L 550,161 L 544,157 L 541,151 Z
    M 524,162 L 532,159 L 540,158 L 548,160 L 553,165 L 554,172 L 552,178 L 547,182 L 541,184
    L 534,183 L 528,179 L 525,173 Z
    M 544,158 L 552,155 L 560,154 L 568,156 L 573,161 L 574,168 L 572,174 L 567,178 L 561,180
    L 554,179 L 548,175 L 545,169 Z
    M 558,100 L 566,96 L 574,95 L 582,97 L 587,102 L 588,109 L 586,115 L 581,119 L 575,121
    L 568,120 L 562,116 L 559,110 Z
    M 556,120 L 564,117 L 572,116 L 580,118 L 585,123 L 586,130 L 584,136 L 579,140 L 573,142
    L 566,141 L 560,137 L 557,131 Z
  `,

  /* ── North Africa ── */
  'north-africa': `
    M 414,230 L 422,226 L 430,224 L 438,225 L 445,228 L 450,233 L 452,240 L 450,246 L 445,251
    L 438,253 L 431,252 L 425,248 L 421,242 Z
    M 448,226 L 456,222 L 464,220 L 472,221 L 479,224 L 484,229 L 486,236 L 484,242 L 479,247
    L 472,249 L 465,248 L 459,244 L 455,238 Z
    M 482,222 L 490,218 L 498,216 L 506,217 L 513,220 L 518,225 L 520,232 L 518,238 L 513,243
    L 506,245 L 499,244 L 493,240 L 489,234 Z
    M 516,218 L 524,214 L 532,212 L 540,213 L 547,216 L 552,221 L 554,228 L 552,234 L 547,239
    L 540,241 L 533,240 L 527,236 L 523,230 Z
    M 550,214 L 558,210 L 566,208 L 574,209 L 581,212 L 586,217 L 588,224 L 586,230 L 581,235
    L 574,237 L 567,236 L 561,232 L 557,226 Z
    M 584,210 L 592,206 L 600,204 L 608,205 L 615,208 L 620,213 L 622,220 L 620,226 L 615,231
    L 608,233 L 601,232 L 595,228 L 591,222 Z
    M 416,250 L 424,247 L 432,246 L 440,248 L 445,253 L 446,260 L 444,266 L 439,270 L 432,272
    L 425,271 L 419,267 L 417,261 Z
    M 444,248 L 452,245 L 460,244 L 468,246 L 473,251 L 474,258 L 472,264 L 467,268 L 460,270
    L 453,269 L 447,265 L 445,259 Z
    M 472,244 L 480,241 L 488,240 L 496,242 L 501,247 L 502,254 L 500,260 L 495,264 L 488,266
    L 481,265 L 475,261 L 473,255 Z
    M 500,240 L 508,237 L 516,236 L 524,238 L 529,243 L 530,250 L 528,256 L 523,260 L 516,262
    L 509,261 L 503,257 L 501,251 Z
    M 528,236 L 536,233 L 544,232 L 552,234 L 557,239 L 558,246 L 556,252 L 551,256 L 544,258
    L 537,257 L 531,253 L 529,247 Z
    M 556,232 L 564,229 L 572,228 L 580,230 L 585,235 L 586,242 L 584,248 L 579,252 L 572,254
    L 565,253 L 559,249 L 557,243 Z
    M 584,228 L 592,225 L 600,224 L 608,226 L 613,231 L 614,238 L 612,244 L 607,248 L 600,250
    L 593,249 L 587,245 L 585,239 Z
  `,

  /* ── West Africa ── */
  'west-africa': `
    M 412,268 L 420,265 L 428,264 L 436,266 L 441,271 L 442,278 L 440,284 L 435,288 L 428,290
    L 421,289 L 415,285 L 413,279 Z
    M 440,266 L 448,263 L 456,262 L 464,264 L 469,269 L 470,276 L 468,282 L 463,286 L 456,288
    L 449,287 L 443,283 L 441,277 Z
    M 468,262 L 476,259 L 484,258 L 492,260 L 497,265 L 498,272 L 496,278 L 491,282 L 484,284
    L 477,283 L 471,279 L 469,273 Z
    M 414,288 L 422,285 L 430,284 L 438,286 L 443,291 L 444,298 L 442,304 L 437,308 L 430,310
    L 423,309 L 417,305 L 415,299 Z
    M 442,286 L 450,283 L 458,282 L 466,284 L 471,289 L 472,296 L 470,302 L 465,306 L 458,308
    L 451,307 L 445,303 L 443,297 Z
    M 470,282 L 478,279 L 486,278 L 494,280 L 499,285 L 500,292 L 498,298 L 493,302 L 486,304
    L 479,303 L 473,299 L 471,293 Z
    M 496,272 L 504,268 L 512,267 L 520,269 L 525,274 L 526,281 L 524,287 L 519,291 L 512,293
    L 505,292 L 499,288 L 497,282 Z
    M 498,290 L 506,287 L 514,286 L 522,288 L 527,293 L 528,300 L 526,306 L 521,310 L 514,312
    L 507,311 L 501,307 L 499,301 Z
  `,

  /* ── East Africa ── */
  'east-africa': `
    M 582,248 L 590,244 L 598,243 L 606,245 L 611,250 L 612,257 L 610,263 L 605,267 L 598,269
    L 591,268 L 585,264 L 583,258 Z
    M 608,246 L 616,242 L 624,241 L 632,243 L 637,248 L 638,255 L 636,261 L 631,265 L 624,267
    L 617,266 L 611,262 L 609,256 Z
    M 584,266 L 592,263 L 600,262 L 608,264 L 613,269 L 614,276 L 612,282 L 607,286 L 600,288
    L 593,287 L 587,283 L 585,277 Z
    M 610,264 L 618,261 L 626,260 L 634,262 L 639,267 L 640,274 L 638,280 L 633,284 L 626,286
    L 619,285 L 613,281 L 611,275 Z
    M 586,284 L 594,281 L 602,280 L 610,282 L 615,287 L 616,294 L 614,300 L 609,304 L 602,306
    L 595,305 L 589,301 L 587,295 Z
    M 612,282 L 620,279 L 628,278 L 636,280 L 641,285 L 642,292 L 640,298 L 635,302 L 628,304
    L 621,303 L 615,299 L 613,293 Z
    M 590,302 L 598,299 L 606,298 L 614,300 L 619,305 L 620,312 L 618,318 L 613,322 L 606,324
    L 599,323 L 593,319 L 591,313 Z
    M 616,300 L 624,297 L 632,296 L 640,298 L 645,303 L 646,310 L 644,316 L 639,320 L 632,322
    L 625,321 L 619,317 L 617,311 Z
  `,

  /* ── Southern Africa ── */
  'southern-africa': `
    M 558,318 L 566,315 L 574,314 L 582,316 L 587,321 L 588,328 L 586,334 L 581,338 L 574,340
    L 567,339 L 561,335 L 559,329 Z
    M 584,316 L 592,313 L 600,312 L 608,314 L 613,319 L 614,326 L 612,332 L 607,336 L 600,338
    L 593,337 L 587,333 L 585,327 Z
    M 560,336 L 568,333 L 576,332 L 584,334 L 589,339 L 590,346 L 588,352 L 583,356 L 576,358
    L 569,357 L 563,353 L 561,347 Z
    M 586,334 L 594,331 L 602,330 L 610,332 L 615,337 L 616,344 L 614,350 L 609,354 L 602,356
    L 595,355 L 589,351 L 587,345 Z
    M 562,354 L 570,351 L 578,350 L 586,352 L 591,357 L 592,364 L 590,370 L 585,374 L 578,376
    L 571,375 L 565,371 L 563,365 Z
    M 588,352 L 596,349 L 604,348 L 612,350 L 617,355 L 618,362 L 616,368 L 611,372 L 604,374
    L 597,373 L 591,369 L 589,363 Z
    M 576,374 L 584,371 L 592,370 L 600,372 L 605,377 L 606,384 L 604,390 L 599,394 L 592,396
    L 585,395 L 579,391 L 577,385 Z
    M 600,372 L 608,369 L 616,368 L 624,370 L 629,375 L 630,382 L 628,388 L 623,392 L 616,394
    L 609,393 L 603,389 L 601,383 Z
    M 580,394 L 588,391 L 596,390 L 604,392 L 609,397 L 610,404 L 608,410 L 603,414 L 596,416
    L 589,415 L 583,411 L 581,405 Z
    M 606,392 L 614,389 L 622,388 L 630,390 L 635,395 L 636,402 L 634,408 L 629,412 L 622,414
    L 615,413 L 609,409 L 607,403 Z
  `,

  /* ── Middle East ── */
  'middle-east': `
    M 590,170 L 598,166 L 606,165 L 614,167 L 619,172 L 620,179 L 618,185 L 613,189 L 606,191
    L 599,190 L 593,186 L 591,180 Z
    M 616,168 L 624,164 L 632,163 L 640,165 L 645,170 L 646,177 L 644,183 L 639,187 L 632,189
    L 625,188 L 619,184 L 617,178 Z
    M 592,188 L 600,185 L 608,184 L 616,186 L 621,191 L 622,198 L 620,204 L 615,208 L 608,210
    L 601,209 L 595,205 L 593,199 Z
    M 618,186 L 626,183 L 634,182 L 642,184 L 647,189 L 648,196 L 646,202 L 641,206 L 634,208
    L 627,207 L 621,203 L 619,197 Z
    M 594,206 L 602,203 L 610,202 L 618,204 L 623,209 L 624,216 L 622,222 L 617,226 L 610,228
    L 603,227 L 597,223 L 595,217 Z
    M 620,204 L 628,201 L 636,200 L 644,202 L 649,207 L 650,214 L 648,220 L 643,224 L 636,226
    L 629,225 L 623,221 L 621,215 Z
    M 642,170 L 650,166 L 658,165 L 666,167 L 671,172 L 672,179 L 670,185 L 665,189 L 658,191
    L 651,190 L 645,186 L 643,180 Z
    M 644,188 L 652,185 L 660,184 L 668,186 L 673,191 L 674,198 L 672,204 L 667,208 L 660,210
    L 653,209 L 647,205 L 645,199 Z
  `,

  /* ── Central Asia ── */
  'central-asia': `
    M 618,120 L 626,116 L 634,115 L 642,117 L 647,122 L 648,129 L 646,135 L 641,139 L 634,141
    L 627,140 L 621,136 L 619,130 Z
    M 644,118 L 652,114 L 660,113 L 668,115 L 673,120 L 674,127 L 672,133 L 667,137 L 660,139
    L 653,138 L 647,134 L 645,128 Z
    M 670,116 L 678,112 L 686,111 L 694,113 L 699,118 L 700,125 L 698,131 L 693,135 L 686,137
    L 679,136 L 673,132 L 671,126 Z
    M 696,114 L 704,110 L 712,109 L 720,111 L 725,116 L 726,123 L 724,129 L 719,133 L 712,135
    L 705,134 L 699,130 L 697,124 Z
    M 620,138 L 628,135 L 636,134 L 644,136 L 649,141 L 650,148 L 648,154 L 643,158 L 636,160
    L 629,159 L 623,155 L 621,149 Z
    M 646,136 L 654,133 L 662,132 L 670,134 L 675,139 L 676,146 L 674,152 L 669,156 L 662,158
    L 655,157 L 649,153 L 647,147 Z
    M 672,134 L 680,131 L 688,130 L 696,132 L 701,137 L 702,144 L 700,150 L 695,154 L 688,156
    L 681,155 L 675,151 L 673,145 Z
    M 698,132 L 706,129 L 714,128 L 722,130 L 727,135 L 728,142 L 726,148 L 721,152 L 714,154
    L 707,153 L 701,149 L 699,143 Z
  `,

  /* ── South Asia ── */
  'south-asia': `
    M 680,164 L 688,160 L 696,159 L 704,161 L 709,166 L 710,173 L 708,179 L 703,183 L 696,185
    L 689,184 L 683,180 L 681,174 Z
    M 706,162 L 714,158 L 722,157 L 730,159 L 735,164 L 736,171 L 734,177 L 729,181 L 722,183
    L 715,182 L 709,178 L 707,172 Z
    M 732,160 L 740,156 L 748,155 L 756,157 L 761,162 L 762,169 L 760,175 L 755,179 L 748,181
    L 741,180 L 735,176 L 733,170 Z
    M 682,182 L 690,179 L 698,178 L 706,180 L 711,185 L 712,192 L 710,198 L 705,202 L 698,204
    L 691,203 L 685,199 L 683,193 Z
    M 708,180 L 716,177 L 724,176 L 732,178 L 737,183 L 738,190 L 736,196 L 731,200 L 724,202
    L 717,201 L 711,197 L 709,191 Z
    M 734,178 L 742,175 L 750,174 L 758,176 L 763,181 L 764,188 L 762,194 L 757,198 L 750,200
    L 743,199 L 737,195 L 735,189 Z
    M 700,200 L 708,197 L 716,196 L 724,198 L 729,203 L 730,210 L 728,216 L 723,220 L 716,222
    L 709,221 L 703,217 L 701,211 Z
    M 726,198 L 734,195 L 742,194 L 750,196 L 755,201 L 756,208 L 754,214 L 749,218 L 742,220
    L 735,219 L 729,215 L 727,209 Z
    M 714,218 L 722,215 L 730,214 L 738,216 L 743,221 L 744,228 L 742,234 L 737,238 L 730,240
    L 723,239 L 717,235 L 715,229 Z
    M 740,216 L 748,213 L 756,212 L 764,214 L 769,219 L 770,226 L 768,232 L 763,236 L 756,238
    L 749,237 L 743,233 L 741,227 Z
  `,

  /* ── East Asia ── */
  'east-asia': `
    M 730,110 L 738,106 L 746,105 L 754,107 L 759,112 L 760,119 L 758,125 L 753,129 L 746,131
    L 739,130 L 733,126 L 731,120 Z
    M 756,108 L 764,104 L 772,103 L 780,105 L 785,110 L 786,117 L 784,123 L 779,127 L 772,129
    L 765,128 L 759,124 L 757,118 Z
    M 782,106 L 790,102 L 798,101 L 806,103 L 811,108 L 812,115 L 810,121 L 805,125 L 798,127
    L 791,126 L 785,122 L 783,116 Z
    M 808,104 L 816,100 L 824,99 L 832,101 L 837,106 L 838,113 L 836,119 L 831,123 L 824,125
    L 817,124 L 811,120 L 809,114 Z
    M 732,128 L 740,125 L 748,124 L 756,126 L 761,131 L 762,138 L 760,144 L 755,148 L 748,150
    L 741,149 L 735,145 L 733,139 Z
    M 758,126 L 766,123 L 774,122 L 782,124 L 787,129 L 788,136 L 786,142 L 781,146 L 774,148
    L 767,147 L 761,143 L 759,137 Z
    M 784,124 L 792,121 L 800,120 L 808,122 L 813,127 L 814,134 L 812,140 L 807,144 L 800,146
    L 793,145 L 787,141 L 785,135 Z
    M 810,122 L 818,119 L 826,118 L 834,120 L 839,125 L 840,132 L 838,138 L 833,142 L 826,144
    L 819,143 L 813,139 L 811,133 Z
    M 736,146 L 744,143 L 752,142 L 760,144 L 765,149 L 766,156 L 764,162 L 759,166 L 752,168
    L 745,167 L 739,163 L 737,157 Z
    M 762,144 L 770,141 L 778,140 L 786,142 L 791,147 L 792,154 L 790,160 L 785,164 L 778,166
    L 771,165 L 765,161 L 763,155 Z
    M 788,142 L 796,139 L 804,138 L 812,140 L 817,145 L 818,152 L 816,158 L 811,162 L 804,164
    L 797,163 L 791,159 L 789,153 Z
    M 840,122 L 848,118 L 856,117 L 864,119 L 869,124 L 870,131 L 868,137 L 863,141 L 856,143
    L 849,142 L 843,138 L 841,132 Z
    M 842,140 L 850,137 L 858,136 L 866,138 L 871,143 L 872,150 L 870,156 L 865,160 L 858,162
    L 851,161 L 845,157 L 843,151 Z
    M 844,158 L 852,155 L 860,154 L 868,156 L 873,161 L 874,168 L 872,174 L 867,178 L 860,180
    L 853,179 L 847,175 L 845,169 Z
  `,

  /* ── Southeast Asia ── */
  'southeast-asia': `
    M 740,200 L 748,197 L 756,196 L 764,198 L 769,203 L 770,210 L 768,216 L 763,220 L 756,222
    L 749,221 L 743,217 L 741,211 Z
    M 766,198 L 774,195 L 782,194 L 790,196 L 795,201 L 796,208 L 794,214 L 789,218 L 782,220
    L 775,219 L 769,215 L 767,209 Z
    M 742,218 L 750,215 L 758,214 L 766,216 L 771,221 L 772,228 L 770,234 L 765,238 L 758,240
    L 751,239 L 745,235 L 743,229 Z
    M 768,216 L 776,213 L 784,212 L 792,214 L 797,219 L 798,226 L 796,232 L 791,236 L 784,238
    L 777,237 L 771,233 L 769,227 Z
    M 744,236 L 752,233 L 760,232 L 768,234 L 773,239 L 774,246 L 772,252 L 767,256 L 760,258
    L 753,257 L 747,253 L 745,247 Z
    M 770,234 L 778,231 L 786,230 L 794,232 L 799,237 L 800,244 L 798,250 L 793,254 L 786,256
    L 779,255 L 773,251 L 771,245 Z
    M 796,208 L 804,205 L 812,204 L 820,206 L 825,211 L 826,218 L 824,224 L 819,228 L 812,230
    L 805,229 L 799,225 L 797,219 Z
    M 822,206 L 830,203 L 838,202 L 846,204 L 851,209 L 852,216 L 850,222 L 845,226 L 838,228
    L 831,227 L 825,223 L 823,217 Z
    M 798,226 L 806,223 L 814,222 L 822,224 L 827,229 L 828,236 L 826,242 L 821,246 L 814,248
    L 807,247 L 801,243 L 799,237 Z
    M 824,224 L 832,221 L 840,220 L 848,222 L 853,227 L 854,234 L 852,240 L 847,244 L 840,246
    L 833,245 L 827,241 L 825,235 Z
    M 800,244 L 808,241 L 816,240 L 824,242 L 829,247 L 830,254 L 828,260 L 823,264 L 816,266
    L 809,265 L 803,261 L 801,255 Z
    M 850,214 L 858,211 L 866,210 L 874,212 L 879,217 L 880,224 L 878,230 L 873,234 L 866,236
    L 859,235 L 853,231 L 851,225 Z
    M 852,232 L 860,229 L 868,228 L 876,230 L 881,235 L 882,242 L 880,248 L 875,252 L 868,254
    L 861,253 L 855,249 L 853,243 Z
  `,

  /* ── Oceania ── */
  'oceania': `
    M 790,370 L 798,366 L 806,365 L 814,367 L 819,372 L 820,379 L 818,385 L 813,389 L 806,391
    L 799,390 L 793,386 L 791,380 Z
    M 816,368 L 824,364 L 832,363 L 840,365 L 845,370 L 846,377 L 844,383 L 839,387 L 832,389
    L 825,388 L 819,384 L 817,378 Z
    M 792,388 L 800,385 L 808,384 L 816,386 L 821,391 L 822,398 L 820,404 L 815,408 L 808,410
    L 801,409 L 795,405 L 793,399 Z
    M 818,386 L 826,383 L 834,382 L 842,384 L 847,389 L 848,396 L 846,402 L 841,406 L 834,408
    L 827,407 L 821,403 L 819,397 Z
    M 794,406 L 802,403 L 810,402 L 818,404 L 823,409 L 824,416 L 822,422 L 817,426 L 810,428
    L 803,427 L 797,423 L 795,417 Z
    M 820,404 L 828,401 L 836,400 L 844,402 L 849,407 L 850,414 L 848,420 L 843,424 L 836,426
    L 829,425 L 823,421 L 821,415 Z
    M 796,424 L 804,421 L 812,420 L 820,422 L 825,427 L 826,434 L 824,440 L 819,444 L 812,446
    L 805,445 L 799,441 L 797,435 Z
    M 822,422 L 830,419 L 838,418 L 846,420 L 851,425 L 852,432 L 850,438 L 845,442 L 838,444
    L 831,443 L 825,439 L 823,433 Z
    M 860,380 L 868,377 L 876,377 L 882,381 L 884,387 L 882,393 L 877,397 L 870,398 L 864,394
    L 861,388 Z
    M 882,360 L 890,357 L 898,357 L 904,361 L 906,367 L 904,373 L 899,377 L 892,378 L 886,374
    L 883,368 Z
  `,
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function WorldMapPage() {
  const router = useRouter()
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const activeRegion = selectedRegion ?? hoveredRegion
  const activeInfo = activeRegion ? regionById[activeRegion] : null

  function handleRegionClick(id: string) {
    setSelectedRegion(id)
    setTimeout(() => router.push(`/cookbooks/region/${id}`), 300)
  }

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: '#050508', color: '#f0f0f0', fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        .ff { font-family: 'Syne', sans-serif; }
        .region-path {
          cursor: pointer;
          transition: filter 0.25s ease, opacity 0.25s ease;
          opacity: 0.72;
        }
        .region-path:hover, .region-path.active {
          opacity: 1;
        }
      `}</style>

      {/* ── Header ── */}
      <div className="px-6 pt-10 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#ff9500' }}>Cookbooks</p>
        <h1 className="ff text-4xl font-extrabold tracking-tight mb-1">Explore the World</h1>
        <p className="text-sm" style={{ color: '#555' }}>Hover a region to preview · Click to explore its recipes</p>
      </div>

      {/* ── Map + Panel layout ── */}
      <div className="flex flex-1 min-h-0" style={{ minHeight: 560 }}>

        {/* ── SVG World Map ── */}
        <div className="flex-1 relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 60%, #0a0e1a 0%, #050508 100%)' }}>

          {/* Ocean grid lines (decorative) */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 960 500"
            xmlns="http://www.w3.org/2000/svg"
            style={{ pointerEvents: 'none', opacity: 0.15 }}
          >
            {/* Latitude lines */}
            {[80, 120, 160, 200, 240, 280, 320, 360, 400].map(y => (
              <line key={y} x1="60" y1={y} x2="900" y2={y} stroke="#1a2040" strokeWidth="0.5" />
            ))}
            {/* Longitude lines */}
            {[100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850].map(x => (
              <line key={x} x1={x} y1="40" x2={x} y2="460" stroke="#1a2040" strokeWidth="0.5" />
            ))}
            {/* Equator highlight */}
            <line x1="60" y1="280" x2="900" y2="280" stroke="#1a3060" strokeWidth="1" strokeDasharray="6 4" />
            {/* Tropics */}
            <line x1="60" y1="240" x2="900" y2="240" stroke="#1a2840" strokeWidth="0.5" strokeDasharray="4 6" />
            <line x1="60" y1="318" x2="900" y2="318" stroke="#1a2840" strokeWidth="0.5" strokeDasharray="4 6" />
          </svg>

          {/* Region paths */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 960 500"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {REGIONS.map(r => (
                <filter key={`glow-${r.id}`} id={`glow-${r.id}`} x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feFlood floodColor={r.glowColor} floodOpacity="1" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>

            {REGIONS.map(r => {
              const isActive = hoveredRegion === r.id || selectedRegion === r.id
              return (
                <path
                  key={r.id}
                  d={REGION_PATHS[r.id] ?? ''}
                  fill={r.color}
                  className={`region-path${isActive ? ' active' : ''}`}
                  style={{
                    filter: isActive ? `url(#glow-${r.id}) brightness(1.45)` : 'none',
                    strokeWidth: isActive ? 1 : 0.5,
                    stroke: isActive ? '#ffffff44' : '#00000040',
                  }}
                  onMouseEnter={() => setHoveredRegion(r.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => handleRegionClick(r.id)}
                />
              )
            })}
          </svg>

          {/* Ocean label */}
          <div
            className="absolute bottom-6 left-8 text-xs font-bold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.08)', letterSpacing: '0.25em', pointerEvents: 'none' }}
          >
            Pacific Ocean
          </div>
          <div
            className="absolute bottom-6 right-12 text-xs font-bold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.06)', letterSpacing: '0.25em', pointerEvents: 'none' }}
          >
            Indian Ocean
          </div>
        </div>

        {/* ── Info Panel ── */}
        <div
          className="flex-shrink-0 flex flex-col justify-between"
          style={{
            width: 300,
            background: '#0c0c10',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Region detail */}
          <div className="flex-1 p-6 flex flex-col">
            {activeInfo ? (
              <div
                key={activeInfo.id}
                style={{ animation: 'fadeIn 0.2s ease' }}
              >
                <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>

                <div className="text-4xl mb-3">{activeInfo.emoji}</div>
                <h2 className="ff text-xl font-extrabold mb-1">{activeInfo.label}</h2>
                <p className="text-xs mb-4" style={{ color: '#777', lineHeight: 1.6 }}>
                  {activeInfo.description}
                </p>

                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(255,149,0,0.12)', color: '#ff9500', border: '1px solid rgba(255,149,0,0.25)' }}
                  >
                    {activeInfo.recipeCount} recipes
                  </div>
                </div>

                <button
                  onClick={() => handleRegionClick(activeInfo.id)}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: activeInfo.color,
                    color: '#fff',
                    boxShadow: `0 0 20px ${activeInfo.glowColor}`,
                  }}
                >
                  Explore {activeInfo.label} →
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: '#333' }}>
                <div className="text-5xl mb-4 opacity-30">🌍</div>
                <p className="text-sm font-medium" style={{ color: '#444' }}>Hover a region<br />on the map</p>
              </div>
            )}
          </div>

          {/* Region list */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest px-4 pt-3 pb-2" style={{ color: '#333' }}>All Regions</p>
            <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleRegionClick(r.id)}
                  onMouseEnter={() => setHoveredRegion(r.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{
                    background: hoveredRegion === r.id || selectedRegion === r.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                    borderLeft: hoveredRegion === r.id || selectedRegion === r.id ? `3px solid ${r.color}` : '3px solid transparent',
                  }}
                >
                  <span className="text-base flex-shrink-0">{r.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{r.label}</p>
                    <p className="text-[10px]" style={{ color: '#444' }}>{r.recipeCount} recipes</p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: r.color, boxShadow: `0 0 6px ${r.glowColor}` }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
