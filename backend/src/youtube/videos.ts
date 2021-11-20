interface VideosList {
    kind: string,
    etag: string,
    items: VideoItem[]
}

interface VideoItem {
    kind: string,
    etag: string,
    id: string,
    statistics: {
        viewCount: string,
        likeCount: string,
        dislikeCount: string,
        favoriteCount: string,
        commentCount: string
    }
}

interface ErrorResponse {
    error: {
        code: number,
        message: string,
        errors: Error[],
        status: string
    }
}

interface Error {
    message: string,
    domain: string,
    reason: string
}

type VideosListResponse = VideosList & ErrorResponse

//Get a list of stats about YouTube videos
const getVideosStatistics = (...videoIds: string[]): Promise<VideosListResponse | undefined> => {
    return new Promise<VideosListResponse | undefined>((resolve) => {
        fetch(`https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${
            encodeURIComponent(videoIds.join(","))
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore:next-line
        }&key=${YOUTUBE_API_KEY}`)
            .then(response => response.json<VideosListResponse>())
            .then(response => { resolve(response) })
            .catch(error => {
                console.log(error)
                resolve(undefined)
            })
    })
}

export default getVideosStatistics;
