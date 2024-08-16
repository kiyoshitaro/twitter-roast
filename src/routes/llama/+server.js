import OpenAI from 'openai';
import { json } from '@sveltejs/kit';

const client = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});
const options = {
	method: 'GET',
	headers: {
		'x-rapidapi-key': process.env.RAPID_API_KEY,
		'x-rapidapi-host': 'twitter283.p.rapidapi.com'
	}
};

const validLanguages = ['english', 'vietnamese'];

export async function POST({ request, platform, ...c }) {
	const { username, language } = await request.json();
	console.log(
		'++++++',
		username,
		'+++++',
		platform?.cf?.region,
		'--',
		platform?.cf?.asOrganization,
		c.getClientAddress()
	);
	if (!validLanguages.includes(language)) {
		return json(
			{ error: 'invalid language specified, please pass a valid language.' },
			{ status: 400 }
		);
	}
	const getRest = await fetch(
		`https://twitter283.p.rapidapi.com/UsernameToUserId?username=${username}`,
		options
	);
	const rest_id = (await getRest.json())?.id_str;
	if (!rest_id) {
		return json({ error: 'Not found twitter user' }, { status: 400 });
	}
	const response = await fetch(
		`https://twitter283.p.rapidapi.com/UserTweets?user_id=${rest_id}`,
		options
	);
	const result = await response.json();
	let userInfo;
	let pinTweet;
	let tweets = [];
	for (const _t of result?.data?.user_result_by_rest_id?.result?.profile_timeline_v2?.timeline
		?.instructions) {
		if (_t?.__typename === 'TimelinePinEntry') {
			const _pintweet = _t?.entry?.content?.content?.tweet_results?.result?.legacy;
			const _userinfo =
				_t?.entry?.content?.content?.tweet_results?.result?.core?.user_results?.result;
			userInfo = {
				username: _userinfo?.core?.name,
				created_at: _userinfo?.core?.created_at,
				// screen_name: _userinfo?.core?.screen_name,
				location: _userinfo?.location?.location,
				bio: _userinfo?.profile_bio?.description,
				followers: _userinfo?.relationship_counts?.followers,
				following: _userinfo?.relationship_counts?.following,
				num_of_tweets: Number(_userinfo?.tweet_counts?.tweets),
				// rest_id: _userinfo?.rest_id,
				is_blue_verified: _userinfo?.verification?.is_blue_verified,
				verified_type: _userinfo?.verification?.verified_type
			};
			console.log(userInfo);
			pinTweet = {
				content: _pintweet?.full_text,
				rest_id: _t?.entry?.content?.content?.tweet_results?.result?.rest_id,
				reply_count: _pintweet?.reply_count,
				retweet_count: _pintweet?.retweet_count,
				favorite_count: _pintweet?.favorite_count,
				created_at: _pintweet?.created_at
			};
		}
		// if (_t?.__typename === 'TimelineAddEntries') {
		// 	console.log(_t?.entries.slice(0, _t?.entries.length - 2).length, 'ss', _t?.entries.length);
		// 	let cntGetReply = 0;
		// 	for (const _tw of _t?.entries.slice(0, _t?.entries.length - 2)) {
		// 		const _tweet =
		// 			_tw?.content?.content?.tweet_results?.result?.__typename === 'Tweet'
		// 				? _tw?.content?.content?.tweet_results?.result
		// 				: _tw?.content?.content?.tweet_results?.result?.tweet;
		// 		if (!userInfo) {
		// 			const _userinfo = _tweet?.core?.user_results?.result;
		// 			userInfo = {
		// 				username: _userinfo?.core?.name,
		// 				created_at: _userinfo?.core?.created_at,
		// 				// screen_name: _userinfo?.core?.screen_name,
		// 				location: _userinfo?.location?.location,
		// 				bio: _userinfo?.profile_bio?.description,
		// 				followers: _userinfo?.relationship_counts?.followers,
		// 				following: _userinfo?.relationship_counts?.following,
		// 				num_of_tweets: Number(_userinfo?.tweet_counts?.tweets),
		// 				// rest_id: _userinfo?.rest_id,
		// 				is_blue_verified: _userinfo?.verification?.is_blue_verified,
		// 				verified_type: _userinfo?.verification?.verified_type
		// 			};
		// 		}
		// 		const _twLegacy = _tweet?.legacy;
		// 		const content = _twLegacy?.full_text
		// 			.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
		// 			.replace(/@/g, '');
		// 		if (
		// 			_tweet?.rest_id &&
		// 			(!_twLegacy?.retweeted_status_results ||
		// 				(Object.keys(_twLegacy?.retweeted_status_results).length === 0 &&
		// 					content.split(' ').length > 10)) &&
		// 			cntGetReply < 5
		// 		) {
		// 			cntGetReply += 1;
		// 			console.log('Loading ===== ', _tweet?.rest_id);
		// 			let replies = [];
		// 			const _response = await fetch(
		// 				`https://twitter283.p.rapidapi.com/TweetDetailConversation?tweet_id=${_tweet?.rest_id}`,
		// 				options
		// 			);
		// 			const _result = await _response.json();
		// 			for (const _rp of _result?.data?.threaded_conversation_with_injections_v2?.instructions[0]
		// 				?.entries) {
		// 				const _rrp =
		// 					_rp?.content?.__typename === 'TimelineTimelineItem'
		// 						? _rp?.content?.content?.tweet_results?.result
		// 						: _rp?.content?.items?.[0]?.item?.content?.tweet_results?.result;
		// 				const contentRep = _rrp?.legacy?.full_text
		// 					.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
		// 					.replace(/@/g, '');
		// 				if (contentRep?.split(' ').length > 10) {
		// 					replies.push({
		// 						content: contentRep,
		// 						username: _rrp?.core?.user_results?.result?.core?.name
		// 					});
		// 				}
		// 			}
		// 			tweets.push({
		// 				// rest_id: _tweet?.rest_id,
		// 				content: content,
		// 				reply_count: _twLegacy?.reply_count,
		// 				retweet_count: _twLegacy?.retweet_count,
		// 				favorite_count: _twLegacy?.favorite_count,
		// 				created_at: _twLegacy?.created_at,
		// 				comments: replies
		// 			});
		// 		}
		// 	}
		// }
	}

	// NOTE: search
	const responseSearch = await fetch(
		`https://twitter283.p.rapidapi.com/Search?q=${username}`,
		options
	);
	const resultSearch = await responseSearch.json();
	let tweetsSearch = [];
	for (const _t of resultSearch?.data?.search_by_raw_query?.search_timeline?.timeline
		?.instructions) {
		if (_t?.__typename === 'TimelineAddEntries') {
			console.log(_t?.entries.slice(0, _t?.entries.length - 2).length, 'ss', _t?.entries.length);
			let cntGetReply = 0;
			for (const _tw of _t?.entries.slice(0, _t?.entries.length - 2)) {
				const _tweet =
					_tw?.content?.content?.tweet_results?.result?.__typename === 'Tweet'
						? _tw?.content?.content?.tweet_results?.result
						: _tw?.content?.content?.tweet_results?.result?.tweet;
				const _twLegacy = _tweet?.legacy;
				const content = _twLegacy?.full_text
					.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
					.replace(/@/g, '');
				if (
					_tweet?.rest_id &&
					(!_twLegacy?.retweeted_status_results ||
						(Object.keys(_twLegacy?.retweeted_status_results).length === 0 &&
							content.split(' ').length > 10)) &&
					cntGetReply < 5
				) {
					cntGetReply += 1;
					console.log('Loading ===== ', _tweet?.rest_id);
					let replies = [];
					const _response = await fetch(
						`https://twitter283.p.rapidapi.com/TweetDetailConversation?tweet_id=${_tweet?.rest_id}`,
						options
					);
					const _result = await _response.json();
					for (const _rp of _result?.data?.threaded_conversation_with_injections_v2?.instructions[0]
						?.entries) {
						const _rrp =
							_rp?.content?.__typename === 'TimelineTimelineItem'
								? _rp?.content?.content?.tweet_results?.result
								: _rp?.content?.items?.[0]?.item?.content?.tweet_results?.result;
						const contentRep = _rrp?.legacy?.full_text
							.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '')
							.replace(/@/g, '');
						if (contentRep?.split(' ').length > 10) {
							replies.push({
								content: contentRep,
								username: _rrp?.core?.user_results?.result?.core?.name
							});
						}
					}
					tweetsSearch.push({
						// rest_id: _tweet?.rest_id,
						content: content,
						reply_count: _twLegacy?.reply_count,
						retweet_count: _twLegacy?.retweet_count,
						favorite_count: _twLegacy?.favorite_count,
						created_at: _twLegacy?.created_at,
						comments: replies
					});
				}
			}
		}
	}

	let prompt = `give a short and harsh roasting for the following Twitter profile: ${userInfo?.username}. Here are the details: "${JSON.stringify(userInfo)}" with recent posts and comments "${JSON.stringify(tweetsSearch)}"`;
	switch (language) {
		case 'vietnamese':
			prompt = `Hãy đưa ra một lời châm chọc ngắn gọn và tàn nhẫn bằng tiếng lóng cho hồ sơ Twitter sau: ${
				userInfo?.username
			}. Đây là thông tin chi tiết: "${JSON.stringify(
				userInfo
			)}", với các bài viết gần nhất cùng các bình luận "${JSON.stringify(tweetsSearch)}"`;
			break;
	}
	console.log(prompt, '=====');

	let systemPrompt =
		'You roast people twitter account based on bio information, username, verify, carefully analyze the last posts with comments to see how the community thinks and include the sarcasm as harshly and poignantly as possible, with 100 - 150 words.';
	switch (language) {
		case 'vietnamese':
			systemPrompt =
				'Bạn hãy châm chọc tài khoản twitter của mọi người dựa trên thông tin bio, username, verify, phân tích kỹ các bài đăng cuối cùng kèm bình luận xem cộng đồng đánh giá thế nào và đưa vào câu châm biếm một cách gay gắt và cay nhất có thể, với 100 - 150 từ';
			break;
	}

	// answerdebug += prompt + '\n';
	try {
		const completion = await client.chat.completions.create({
			model: 'gpt-4o-mini',
			stream: false,
			messages: [
				{
					role: 'system',
					content: systemPrompt
				},
				{ role: 'user', content: prompt }
			]
		});

		const roast = completion.choices[0].message.content;
		// try {
		// 	await platform.env.DB.prepare(
		// 		'INSERT INTO roasts (gh_username, response, created_at, country, ip_address) VALUES (?, ?, ?, ?, ?)'
		// 	)
		// 		.bind(
		// 			username,
		// 			roast,
		// 			Math.floor(new Date().getTime() / 1000),
		// 			request?.cf?.country || '',
		// 			sha256(request.headers.get('cf-connecting-ip')) || ''
		// 		)
		// 		.run();
		// } catch {}
		console.log(roast);
		return json({ roast });
	} catch (error) {
		console.error('Error:', error);
		return json({ error: 'Failed to generate roast' }, { status: 500 });
	}
}

// function sha256(str) {
// 	// Get the string as arraybuffer.
// 	var buffer = new TextEncoder('utf-8').encode(str);
// 	return crypto.subtle.digest('SHA-256', buffer).then(function (hash) {
// 		return hex(hash);
// 	});
// }
