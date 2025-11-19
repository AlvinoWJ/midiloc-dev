export type BlockPaging = {
  serverPage: number; // page untuk API (per blok)
  serverLimit: number; // limit untuk API (ukuran blok)
  sliceStart: number; // index mulai (0-based) untuk sub-halaman di blok
  sliceEnd: number; // index akhir eksklusif
  blockIndex: number; // index blok (0-based)
  localPageIndex: number; // index sub-halaman dalam blok (0..pagesPerBlock-1)
};

export function computeBlockPaging(
  clientPage: number,
  clientPageSize = 1,
  pagesPerBlock = 2
): BlockPaging {
  if (clientPage < 1) clientPage = 1;

  const blockSize = clientPageSize * pagesPerBlock; // 90
  const blockIndex = Math.floor((clientPage - 1) / pagesPerBlock);
  const serverPage = blockIndex + 1;
  const serverLimit = blockSize;

  const localPageIndex = (clientPage - 1) % pagesPerBlock;
  const sliceStart = localPageIndex * clientPageSize;
  const sliceEnd = sliceStart + clientPageSize;

  return {
    serverPage,
    serverLimit,
    sliceStart,
    sliceEnd,
    blockIndex,
    localPageIndex,
  };
}
