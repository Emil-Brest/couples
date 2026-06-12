-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('MOVIE', 'SERIES', 'DOCUMENTARY', 'ANIME', 'SHORT');

-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('PENDING', 'BUCKET', 'WATCHED', 'SKIPPED');

-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ContentType" NOT NULL DEFAULT 'MOVIE',
    "platform" TEXT,
    "coverUrl" TEXT,
    "description" TEXT,
    "year" INTEGER,
    "addedById" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "status" "WatchStatus" NOT NULL DEFAULT 'PENDING',
    "watchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_votes" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "want" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watch_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_reviews" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "watch_votes_itemId_userId_key" ON "watch_votes"("itemId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "watch_reviews_itemId_userId_key" ON "watch_reviews"("itemId", "userId");

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_votes" ADD CONSTRAINT "watch_votes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "watchlist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_votes" ADD CONSTRAINT "watch_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_reviews" ADD CONSTRAINT "watch_reviews_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "watchlist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_reviews" ADD CONSTRAINT "watch_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
