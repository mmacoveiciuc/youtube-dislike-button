import { Request } from 'itty-router';
import getVideosStatistics from '../youtube/videos';

// Returns video stats for a YouTube video
const GetVideoStats = async (request: Request): Promise<Response> => {
    // Parse inputs
    const { query } = request
    const video = query && query.video;

    const headers = {
        'Content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    if (!video) {
        const body = JSON.stringify({ error: 'YouTube video ID was not provided' })
        return new Response(body, { headers, status: 400 })
    }

    // Get statistics from the YouTube API
    const videoStats = await getVideosStatistics(video);
    
    // Something happened with our request. Perhaps an invalid video id was supplied.
    if (!videoStats || videoStats.error) {
        console.log(videoStats);
        const body = JSON.stringify({ error: 'Failed retrieving YouTube video statistics' })
        return new Response(body, { headers, status: 500 })
    }
    
    // Make sure some videos were returned
    if (videoStats.items.length === 0) {
        const body = JSON.stringify({ error: 'Invalid YouTube video id' })
        return new Response(body, { headers, status: 400 })
    }

    const body = JSON.stringify({
        dislikes: videoStats.items[0].statistics.dislikeCount,
        likes: videoStats.items[0].statistics.likeCount
    })
    return new Response(body, { headers, status: 200 })
};

export default GetVideoStats;
