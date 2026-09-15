import type { StackIconSlug } from '@/lib/stack-icons';

export type SocialNetwork = {
  name: string;
  /**
   * `null` where no icon set here publishes a mark for it.
   *
   * LinkedIn is the case: Simple Icons withdrew it, and Lucide dropped its
   * brand icons in v1, so there is no mark to draw and hand-tracing a
   * trademark is not the answer. `lettermark` stands in.
   */
  icon: StackIconSlug | null;
  /** Typographic stand-in for a missing mark, in the spirit of the monogram. */
  lettermark?: string;
  /** Shown under the name, as the reference does. */
  handle: string;
  /**
   * Where the card goes, or `null` for an account that has no address.
   *
   * Discord is the one: a username is not a location there — public profile
   * URLs are built from a numeric snowflake id, not from the name, so
   * `discord.com/users/8mat` resolves to nothing. Rather than ship a link that
   * goes nowhere, that card hands over the username instead.
   */
  href: string | null;
};

/**
 * The networks the contact carousel carries, in the order it shows them.
 */
export const socialNetworks: SocialNetwork[] = [
  {
    name: 'LinkedIn',
    icon: null,
    lettermark: 'in',
    handle: '@mateus-bastos',
    href: 'https://www.linkedin.com/in/mateus-bastos-39615228b',
  },
  {
    name: 'GitHub',
    icon: 'github',
    handle: '@mateuskk',
    href: 'https://github.com/mateuskk',
  },
  {
    name: 'Instagram',
    icon: 'instagram',
    handle: '@mateusssb_',
    href: 'https://www.instagram.com/mateusssb_/',
  },
  {
    name: 'Spotify',
    icon: 'spotify',
    handle: '@mateus',
    href: 'https://open.spotify.com/user/aqnf4f3k0xfw6r18q8yhne5m4',
  },
  {
    name: 'Discord',
    icon: 'discord',
    handle: '8mat',
    href: null,
  },
];
