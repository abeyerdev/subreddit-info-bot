import snoowrap from 'snoowrap'
import credentials from './config/credentials'
import subreddits from './config/subreddits'

const BOT_NAME = 'subreddit-info-bot'
const { userAgent, clientId, clientSecret, username, password } = credentials
const r = new snoowrap({
    userAgent,
    clientId,
    clientSecret,
    username,
    password
});

let repliedComments = []

async function main() {
    try {
        while(true) {
            for(var subreddit of subreddits) {           
                await findAndReplyToEligibleComments(subreddit)
                    .catch((e) => console.log(e))     
            }
            await sleep(5000)
        }
    } catch(e) {
        console.error(e)
    }   
}

// A valid comment would be in the form 'r/iamverysmart or /r/iamverysmart' 
function isValidComment(comment) {    
    if(repliedComments.includes(comment.id)) {
        console.log(`Comment ${ comment.id } ain\'t valid man, dupes!`)
        return false
    }
    
    // TODO: Make sure the bot can't reply to itself.
    if(comment.expandReplies().replies.findIndex((reply) => reply.author.name === BOT_NAME) > -1) {
        console.log(`Already replied to comment ${ comment.id }`)
        return false
    }

    const validHtml = comment.body_html.includes('<a href="/r/')
    const eligibleBody = comment.body.split(' ')[0];
    const validBody = eligibleBody.match(/\/?r\/[A-Za-z]{3,}/g)

    return validHtml && validBody
}

async function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function findAndReplyToEligibleComments(subredditName) {
    r.getSubreddit(subredditName)
        .getNewComments()
        .filter(comment => isValidComment(comment))
        .map(validComment => {
            const subredditPosted = validComment.body.split(' ')[0]
            const subredditName = validComment.body
                .split(' ')[0]
                .replace(/\/?r\//g, '')
            return {
                id: validComment.id,
                subredditName,
                subredditPosted                
            }
        })
        //.then(console.log)
        .forEach(comment => {
            createBotReply(comment)
                .then(repliedComments.push(comment.id))
                .catch((e) => console.log(e))
        })
        .then(() => console.log('Current reply array:\n', JSON.stringify(repliedComments)))
}

// Create a reply to an eligible comment with information
// regarding whether or not the poted subreddit exists.
async function createBotReply(comment) {    
    const { id, subredditName, subredditPosted } = comment
    let replyText = `${ subredditPosted } isn't real.` 

    if(await subredditExists(subredditName)) { 
        replyText = `${ subredditPosted } is actually real.` 
    }

    console.log(replyText)
    return r.getComment(id).reply(replyText)
}

// TODO: This could be getSubredditInfo and return an object
// with an exists attribute in both cases.
async function subredditExists(subredditName) {
    try {
        const created = await r.getSubreddit(subredditName).created
        return true
    } catch(e) {
        return false
    }
}

main()

// (function test() {
//     subredditExists('kappa').then(console.log)
// })()
