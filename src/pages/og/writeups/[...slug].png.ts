import type { APIRoute } from 'astro';
import { writeupOgPaths, writeupOgResponse } from '../../../lib/og-entry';

export async function getStaticPaths() {
  return writeupOgPaths('en');
}

export const GET: APIRoute = async ({ props }) => writeupOgResponse(props.entry);
