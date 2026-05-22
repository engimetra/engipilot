import * as Minio from "minio"

const ENDPOINT   = process.env.MINIO_ENDPOINT   ?? "localhost"
const PORT       = parseInt(process.env.MINIO_PORT ?? "9000", 10)
const ACCESS_KEY = process.env.MINIO_ACCESS_KEY  ?? "minioadmin"
const SECRET_KEY = process.env.MINIO_SECRET_KEY  ?? "minioadmin123"
export const BUCKET = process.env.MINIO_BUCKET   ?? "engipilot-documents"

let client: Minio.Client | null = null

export function getMinioClient(): Minio.Client {
  if (!client) {
    client = new Minio.Client({
      endPoint:  ENDPOINT,
      port:      PORT,
      useSSL:    false,
      accessKey: ACCESS_KEY,
      secretKey: SECRET_KEY,
    })
  }
  return client
}

export async function ensureBucket(): Promise<void> {
  const mc = getMinioClient()
  const exists = await mc.bucketExists(BUCKET)
  if (!exists) {
    await mc.makeBucket(BUCKET, "us-east-1")
  }
}

export async function uploadToMinio(
  buffer: Buffer,
  objectName: string,
  mimeType: string
): Promise<string> {
  const mc = getMinioClient()
  await ensureBucket()
  await mc.putObject(BUCKET, objectName, buffer, buffer.length, { "Content-Type": mimeType })
  // URL présignée valide 7 jours
  return mc.presignedGetObject(BUCKET, objectName, 7 * 24 * 3600)
}
