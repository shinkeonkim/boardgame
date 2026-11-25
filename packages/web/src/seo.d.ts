import type { GameMeta } from '@bg/core';

export declare const SITE: {
  origin: string;
  name: string;
  nameEn: string;
  locale: string;
  description: string;
  image: string;
  imageAlt: string;
  themeColor: string;
};
export interface PageSeo {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  imageSize?: [number, number];
  type?: 'website' | 'article';
  robots?: string;
  keywords?: string[];
  jsonLd?: object[];
}
export declare function esc(s: unknown): string;
export declare function abs(path: string): string;
export declare function ldJson(data: object): string;
export declare function headTags(p: PageSeo): string;
export declare function injectHead(html: string, tags: string): string;
export declare function gameFacts(g: GameMeta): string;
export declare function gameKeywords(g: GameMeta, tagLabels?: Record<string, string>): string[];
export declare function gameJsonLd(g: GameMeta, tagLabels?: Record<string, string>): object;
export declare function gamePageSeo(g: GameMeta, tagLabels?: Record<string, string>): PageSeo;
