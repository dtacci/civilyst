import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@clerk/nextjs/server';
import { UploadThingError } from 'uploadthing/server';

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define a route for campaign images
  campaignImageUploader: f({
    image: {
      maxFileSize: '16MB', // Max 16MB per image
      maxFileCount: 5, // Max 5 images per campaign
    },
  })
    // `req` isn't needed here, so omit the parameter to satisfy ESLint
    .middleware(async () => {
      // Get Clerk userId from the request
      const { userId } = await auth();

      // If no userId, reject the upload
      if (!userId) throw new UploadThingError('Unauthorized');

      // Return metadata to be stored with the file
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      // Log upload completion in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Upload complete for userId:', metadata.userId);
        console.warn('File URL:', file.url);
      }

      // You can use the metadata and file data to save to your database
      // For example:
      // await db.image.create({
      //   data: {
      //     url: file.url,
      //     name: file.name,
      //     size: file.size,
      //     key: file.key,
      //     userId: metadata.userId,
      //   },
      // });

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
