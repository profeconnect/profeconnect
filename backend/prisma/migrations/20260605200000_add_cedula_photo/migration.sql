-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "cedulaPhotoPath" TEXT,
ADD COLUMN "cedulaPhotoMime" TEXT,
ADD COLUMN "cedulaPhotoName" TEXT;

-- AlterTable
ALTER TABLE "solicitudes_registro" ADD COLUMN "cedulaPhotoPath" TEXT,
ADD COLUMN "cedulaPhotoMime" TEXT,
ADD COLUMN "cedulaPhotoName" TEXT;
