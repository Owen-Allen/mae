
const fs = require("fs");
const prompt = require('prompt-sync')();



//because neighbourhood is size two
let NB = 5;
//matches a user to their average ranked score
dictionaryOfAverages = {}
let dictionaryOfCss;
topNBScores = {}
needsRanking = []
needsNewRanking = []



let items;
let newItems;

function parseFile(content){
    console.log("parseFile")

    //console.log(content)
    let info = content.split("\n")
    //console.log(info)
    topRow = info[0].split(" ")
    let numUsers = Number(topRow[0])
    let numItems = Number(topRow[1])
    //console.dir({numUsers,numItems})
    let numToScan = numUsers+3;
    let newInfo = []
    for (let i = 1; i< numToScan; i++){
        info[i] = info[i].split(" ")
        //check for weird spaces in input
        let index = info[i].indexOf("")
        if (index > 1){
            info[i].splice(index,1)
        }
    }
    //sort the information
    usersInfo = info.splice(1,2)
    itemInfo = info.splice(1,info.length)
    //get rid of spaces
    let index = itemInfo.indexOf("")
    if (index > 1){
        itemInfo.splice(index,1)
    }
    //console.dir({usersInfo})
    //console.dir({itemInfo})
    items = itemInfo;
    //generate a dictionary of user averages
    for (let user = 0; user < numUsers; user++){
        let average = 0;
        let numReviews = 0;
        for (let rev = 0; rev< numItems; rev++ ){
            //console.log(itemInfo[user][rev])
            itemInfo[user][rev] = Number(itemInfo[user][rev])
            if (itemInfo[user][rev] != 0){
                average+= itemInfo[user][rev]
                numReviews++;
                needsNewRanking.push({user: user, item: rev})
            }else{
                //console.log("I found a 0")
                //user is the row, item is the column
                needsRanking.push({user: user, item: rev})
            }
        }
        //console.log(average)
        let sum = average;
        average = average/numReviews;
        dictionaryOfAverages[user]={average: average, sum: sum, count: numReviews};
    }
}



    //get the top two values
    
    //console.log(dictionaryOfpcc)



function adjustedCosineSim(a,b){
    
    /*
    req 
    - the average rating each user makes
    - a and b are numbers correspond to the column index on the items array

    - first, collect all the users who have rated both a & b

    
    numerator = for user in subset (user rating of item a - average user rating)*(user rating of item b - average user rating)
    denom= sqrt(for user in subset (user rating of item a - average user rating)*2) * sqrt(for user in subset (user rating of item b - average user rating)*2) 
    we should compile denom in parts a and b and then sqrt at the end of calculations before joining numerator and denom for final calculation

    */

    // Loop through items to collect users who rated both a and b
    usersWhoRanked = []
    for(let u = 0; u < items.length; u++){
        if(items[u][a] != 0 && items[u][b] != 0){ // User has rated both A and B
            usersWhoRanked.push(u)  // user row index
        }
    }
    
    let denomA = 0;
    let denomB = 0;
    let numerator= 0;
    for (user of usersWhoRanked){
        numerator += (items[user][a]-dictionaryOfAverages[user].average) * (items[user][b]-dictionaryOfAverages[user].average)
        denomA += (items[user][a]-dictionaryOfAverages[user].average)**2
        denomB += (items[user][b]-dictionaryOfAverages[user].average)**2
    }
        
    denominator = (Math.sqrt(denomA) * Math.sqrt(denomB))

    //key is value a, comparedTo is item b it was compared to, score is CSS
    let score = numerator/denominator
    dictionaryOfCss[a][b] = {score: score, itemB: b}
    dictionaryOfCss[b][a] = {score: score, itemB: a}
}



function determineNewRanking(u,p){
    //console.log("determineNewRanking")

    let numerator = 0
    let denominator = 0


    // We need to know which neighbours to skip
    let neighboursChecked = 0
    for (var item of topNBScores[p]){
        if(neighboursChecked == NB){
            break
        }

        if(items[u][item.itemB] != 0){
            neighboursChecked++
            numerator += (item.score * items[u][item.itemB])
            denominator += item.score
        }
    }

    if (denominator == 0){
                                // get the sum of all user reviews - this specific review
        averageWithoutItem = (dictionaryOfAverages[user].sum - items[u][p])/ (dictionaryOfAverages[user].count-1)
        if ((dictionaryOfAverages[user].count-1) == 0){   
            console.log('BAD CASE OF COUNT = 0, USER ONLY REVIEWED ONE ITEM')
        }
        newItems[u][p] = averageWithoutItem;
        
    }else{
        newItems[u][p] = numerator/denominator
    }
    //console.log("numerator/denominator")

    // console.log(numerator/denominator)

}





async function readFile(){
    console.log("readFile")
    //let input = prompt("File to open: ")
    let input = "parsed-data-trimmed.txt"
    //let input = 'test.txt'
    let returnContent;
    return await fs.promises.readFile(input,'utf-8')

}

function computeTopNB(){
    for (let item = 0; item<items[0].length; item++){
        topNBScores[item] = dictionaryOfCss[item].sort((a,b) => b.score - a.score)
        topNBScores[item]= topNBScores[item].filter(function(x){ return x.score > 0})
        //console.log(topNBScores)
    }
    //console.log(topNBScores)
}



function calculateLOO(u,p){
    let numerator = 0
    let denominator = 0




    // We need to know which neighbours to skip
    let neighboursChecked = 0
    for (var item of topNBScores[p]){
        if(neighboursChecked == NB){
            break
        }

        if(items[u][item.itemB] != 0){
            neighboursChecked++
            numerator += (item.score * items[u][item.itemB])
            denominator += item.score
        }
    }

    if (denominator == 0){
                                // get the sum of all user reviews - this specific review
        averageWithoutItem = (dictionaryOfAverages[user].sum - items[u][p])/ (dictionaryOfAverages[user].count-1)
        if ((dictionaryOfAverages[user].count-1) == 0){   
            console.log('BAD CASE OF COUNT = 0, USER ONLY REVIEWED ONE ITEM')
        }
        return averageWithoutItem;
        
    }else{
        return numerator/denominator;
    }
}

async function main(){
    let content = await readFile()
    parseFile(content)
    //console.log("items")
    //console.log(items)
    //console.log("needsRanking")
    //console.log(needsRanking)
    
    dictionaryOfCss = Array(items[0].length).fill(-2).map(() => Array(items[0].length).fill({score: -2, itemB: -2}))

    // calculate every items cosine sim against every other item 
    // WE COULD ONLY DO THIS FOR ITEMS WE NEED TO RANK, BUT THIS GIVES US MASTER DATA
    for (let i = 0; i< items[0].length; i++){
        for (let j = 0; j < items[0].length; j++){
            // has not already been calculated (holder val is -2)
            if(j != i && (dictionaryOfCss[i][j].score == -2 || dictionaryOfCss[j][i].score == -2)){
                adjustedCosineSim(i,j)
            }
        }
    }
    //console.log(dictionaryOfCss)
    
    //topTwoScores[user] = pccScores.sort((a, b) => b.score - a.score).slice(0,2)
    computeTopNB();
    // Find the nearest NB neighbours to the product in needsRanking
    newItems = JSON.parse(JSON.stringify(items))
    

    let meanSum = 0;
    let meanCount = 0
    /*for (needed of needsRanking){
        determineNewRanking(needed.user,needed.item)
        absDiff = Math.abs(newItems[needed.user][needed.item] - items[needed.user][needed.item])
        meanSum += absDiff
        meanCount += 1
    }*/


    for (needed of needsNewRanking){
        absDiff = Math.abs(calculateLOO(needed.user,needed.item) - items[needed.user][needed.item])
        meanSum += absDiff
        meanCount += 1
    }
    
    console.log(meanSum / meanCount)

    let writeString = ""
    for(let row = 0; row < newItems.length; row++){
        for(let col = 0; col < newItems[row].length; col++){
            writeString+= newItems[row][col]
            writeString+= " "
        }
        writeString += "\n"
    }

    fs.writeFileSync("result.md", writeString)
    //CALL MAE ON NEWITEMS
}

main()