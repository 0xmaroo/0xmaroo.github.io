import type { APIRoute } from 'astro';
import { projectOgPaths, projectOgResponse } from '../../../../lib/og-entry';

export async function getStaticPaths() {
  return projectOgPaths('ar');
}

export const GET: APIRoute = async ({ props }) => projectOgResponse(props.entry);
