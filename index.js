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
            for(let i = 0; i< subreddits.length; i++) {           
                await findAndReplyToEligibleComments(subreddits[i]).catch((e) => console.log(e))            
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
        console.log('ain\'t valid man, dupes!')
        return false
    }
    
    // TODO: Get this working to not create dupes...
    // comment can't already have been replied to by this bot
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
        .map(comment => {
            console.log(`Found comment ${ comment.id }`, comment)
            return {
                id: comment.id,
                subredditPosted: comment.body.split(' ')[0]
            }
        })
        //.then(console.log)
        .forEach(comment => { 
            createBotReply(comment.id, comment.subredditPosted)
                .then(repliedComments.push(comment.id))
                .catch((e) => console.log(e)) 
        })
}

// Create a reply to an eligible comment with information
// regarding whether or not the poted subreddit exists.
async function createBotReply(commentId, subredditPosted) {
    let replyText = ''

    if(subredditExists(subredditPosted)) { 
        replyText = 'This subreddit exists' 
    } else { 
        replyText = 'This subreddit doesn\'t exist' 
    }
    
    console.log(replyText)
    return r.getComment(commentId).reply(replyText)
}

async function subredditExists(subredditName) {
    return r.getSubreddit(subredditName) != null
}

main()
