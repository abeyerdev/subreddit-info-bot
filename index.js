import snoowrap from 'snoowrap'
import credentials from './config/credentials'
import subreddits from './config/subreddits'

const { userAgent, clientId, clientSecret, username, password } = credentials

const r = new snoowrap({
    userAgent,
    clientId,
    clientSecret,
    username,
    password
});

async function main() {
    try {
        while(true) {
            for(let i = 0; i < subreddits.length; i++) {            
                await findAndReplyToEligibleComments(subreddits[i])            
            }
            await sleep(5000)
        }
    } catch(e) {
        console.error(e)
    }   
}

// A valid comment would be in the form 'r/iamverysmart or /r/iamverysmart' 
function isValidComment(comment) {
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
            return {
                id: comment.id,
                subredditPosted: comment.body.split(' ')[0]
            }
        })
        .forEach(comment => { 
            await createBotReply(comment.id, comment.subredditPosted) 
        })
}

// Create a reply to an eligible comment with information
// regarding whether or not the poted subreddit exists.
async function createBotReply(commentId, subredditPosted) {
    let replyText = ''

    if(subredditExists(subredditPosted)) { 
        replyText = 'this' 
    } else { 
        replyText = 'that' 
    }
    
    return r.getComment(commentId).reply(replyText)
}

async function subredditExists(subredditName) {
    return r.getSubreddit(subredditName) != null
}

main()
