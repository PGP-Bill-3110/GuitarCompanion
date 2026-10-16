import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import {
  storage,
} from "../config/firebase";

export interface UploadedMedia {
  url: string;

  path: string;

  contentType: string;
}

export async function uploadCommunityImage(
  uid: string,
  uri: string
): Promise<UploadedMedia> {
  const response =
    await fetch(uri);

  const blob =
    await response.blob();

  const contentType =
    blob.type ||
    "image/jpeg";

  const extension =
    getExtensionFromType(
      contentType
    );

  const fileName =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

  const path =
    `community/${uid}/images/${fileName}`;

  const storageRef =
    ref(
      storage,
      path
    );

  await uploadBytes(
    storageRef,
    blob,
    {
      contentType,
    }
  );

  const url =
    await getDownloadURL(
      storageRef
    );

  return {
    url,
    path,
    contentType,
  };
}

function getExtensionFromType(
  contentType: string
) {
  if (
    contentType.includes(
      "png"
    )
  ) {
    return "png";
  }

  if (
    contentType.includes(
      "webp"
    )
  ) {
    return "webp";
  }

  return "jpg";
}