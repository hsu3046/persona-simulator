// MediaChannel → 표시 라벨 + Phosphor 아이콘 + 색.
// Persona / Product / Exposure 카드 전반에서 사용.

import {
  AtIcon,
  BellIcon,
  ChatCenteredDotsIcon,
  GlobeHemisphereWestIcon,
  InstagramLogoIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  MonitorIcon,
  NewspaperIcon,
  StorefrontIcon,
  TiktokLogoIcon,
  TrainIcon,
  UsersThreeIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

import type { MediaChannel } from "@/types";

export interface ChannelMeta {
  channel: MediaChannel;
  label: string;
  Icon: Icon;
  /** Tailwind text color class (Phosphor 아이콘 색). */
  fgClass: string;
}

export const CHANNEL_META: Record<MediaChannel, ChannelMeta> = {
  instagram: {
    channel: "instagram",
    label: "인스타그램",
    Icon: InstagramLogoIcon,
    fgClass: "text-[#E1306C]",
  },
  youtube: {
    channel: "youtube",
    label: "유튜브",
    Icon: YoutubeLogoIcon,
    fgClass: "text-[#FF0000]",
  },
  tiktok: {
    channel: "tiktok",
    label: "틱톡",
    Icon: TiktokLogoIcon,
    fgClass: "text-foreground",
  },
  naver_search: {
    channel: "naver_search",
    label: "네이버 검색",
    Icon: MagnifyingGlassIcon,
    fgClass: "text-[#03C75A]",
  },
  google_search: {
    channel: "google_search",
    label: "구글 검색",
    Icon: GlobeHemisphereWestIcon,
    fgClass: "text-[#4285F4]",
  },
  kakao_talk: {
    channel: "kakao_talk",
    label: "카카오톡",
    Icon: ChatCenteredDotsIcon,
    fgClass: "text-[#FEE500]",
  },
  tv: {
    channel: "tv",
    label: "TV",
    Icon: MonitorIcon,
    fgClass: "text-chart-3",
  },
  subway_ad: {
    channel: "subway_ad",
    label: "지하철",
    Icon: TrainIcon,
    fgClass: "text-chart-2",
  },
  outdoor_ad: {
    channel: "outdoor_ad",
    label: "옥외 광고",
    Icon: StorefrontIcon,
    fgClass: "text-chart-4",
  },
  word_of_mouth: {
    channel: "word_of_mouth",
    label: "입소문",
    Icon: UsersThreeIcon,
    fgClass: "text-accent-foreground",
  },
  blog_review: {
    channel: "blog_review",
    label: "블로그",
    Icon: NewspaperIcon,
    fgClass: "text-chart-5",
  },
  podcast: {
    channel: "podcast",
    label: "팟캐스트",
    Icon: MicrophoneIcon,
    fgClass: "text-primary",
  },
  email: {
    channel: "email",
    label: "이메일",
    Icon: AtIcon,
    fgClass: "text-muted-foreground",
  },
  push_notification: {
    channel: "push_notification",
    label: "푸시",
    Icon: BellIcon,
    fgClass: "text-primary",
  },
};

export const ALL_CHANNELS: MediaChannel[] = Object.keys(
  CHANNEL_META,
) as MediaChannel[];
