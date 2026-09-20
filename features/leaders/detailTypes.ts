export type DetailRow = { id: string; name: string; meta: string };
export type ActivityRow = { id: string; time: string; description: string };

export type LeaderDetailData = {
  pointers: DetailRow[];
  people: DetailRow[];
  vehicles: DetailRow[];
  activity: ActivityRow[];
};
