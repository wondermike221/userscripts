// ==UserScript==
// @name         Scrape Workorder Data
// @namespace    https://hixon.dev
// @version      0.1.97
// @description  Various automations on SmartIT
// @match        https://ebay-smartit.onbmc.com/smartit/app/
// @match        https://hub.corp.ebay.com/
// @icon         https://www.google.com/s2/favicons?domain=docs.bmc.com
// @grant        GM.xmlhttpRequest
// @require      https://raw.githubusercontent.com/wondermike221/userscripts/main/lib.js
// @connect      *
// @connect      https://hub.corp.ebay.com/searchsvc/profile/*
// @connect      https://peoplex.corp.ebay.com/peoplexservices/*
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/wondermike221/userscripts/main/workorder_scraper.user.js
// @homepageURL  https://github.com/wondermike221/userscripts
// ==/UserScript==

/** TODOS
 * [x] press 's' to search
 * [ ] auto expand notes so public checkbox shows.
 * [ ] imagus like preview for the summary section.
*/


// Constants
const SUCCESS_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAbUlEQVRIiWNgGE7Am4GB4QkDA8N/MjFB8JgCw4mygGiFpAAmahtIigXkxsljBgYGT2wGogcRJXHyiBgLyI0TFH0DGgejFoxaMFIsYEFiM9LCggENoidQmpyK5zExlnsykFeiPmJgYPAgxoKhAQAobmMW+E0ohwAAAABJRU5ErkJggg=='
const FAILURE_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAEi0lEQVRoge2ZTU8bVxSG33NpU5WCKCUTY4TUWBDCh+hiZmE2LMKCOwKFIqxIbQqb/ICA2k35B+2qVf9D1aZVUkWVgqgrpQsWYVEWVIaqRsIIRIlg4YliyxH4nC74ECB7fMdjFpX8Sl5Yc+fc9xnfc+fcY6Cuuuqq63+j3PRUVB5MNF9VfHkw0ZybnooGuUeZDizMJB4qUtuFw2ub+ZlEPLg9f+VnEvHC4bVNRWq7MH1v1vQ+Mgr+2dQcBN+cfhfIKyLSjd8/eVGN2cvK3Z90CA1JQFrPjAnNv/vD468q3VsRIP/p5JycM39Or0iUbnwUDiJ3f9IBIwmg9fI1EZpvevSLL4QvwOt7E7MgfOszxFOKdOOPT5fN7F5U/pOP48yyCKCl3BgBzTb/9PS7ctfLAuSmdJTV29sAGvxtkMdS1C2PnwWC8BJjcUUNi4CUNX+iIhF3Nv38bK/UxbJJnD9657VwMSvM8P8UW0iw6CXGjBPbS4zFSbAoXGwxiJ/NI/+6XCzfJZSd0jYxJQF8YOILityWJwu+OZGdHHUIquSaryZmxSTO3tU2IMYQBHZbfv295ITZ8VEHqnTCBo11KqNtNHtX28JsDMEsbtvCxYmz46OOHD8II/OlYpSSEQAAZPWIzcp8OQnozEB2/I7DfHGfN723kowBAGBfj9gqwHKCEpeLdKjIfNlAidu28IfxuyUQAAAcjN6JQ9h3775g6FhmY0np6789D7QdBwYAgP2RYRvHT9XklzCRRyz6+vOlwC/EqgCAYwgWTlJoCPIY0O1VmAdCAADA/vCQzWSc2KXkCYtuX3pRlXkgJAAA7A4P2UqME/u8PIBCmQdqAAAAu0OOTUoFgfBIsW5f+jOUeQB4K2wAAIAIMYMAMRpOAIpFqcnDC7+E4rbDYrzPn5cHgtu5vBLqPBEKYMu2HdXASUhg86fyiJXbuVI9RNUAW/agQ0LVPPnL8hTB7VxZrQqiKoCtwUEHyrgwM5HHotzYanCIwACbH/XHScjkJAWATkoJs7FComOra1dXSmwN9jpc5gBeQh5EaRI5FBWgAGRyY+vrtS/mNnp7HUVsfhgh0bG19DIAZPq6bYbxe8IjsBtb36hdOb3R2xUkYT3FpGPp9IWlkO7rthUbF4CeUjCCqAiw0dXloAGmW6XHULrnkvlTpbu7bRCSBDE7FAm5tzb8IXwBNrq6HBHzZSMsuieT8U3CdPeHNth8OYHFvZXJBD/U/337drN6U9gE0GY0Eaii+VP9c/NmHPBvaJ1JcHDYlI8NpPZLtlbK9oW4UGgS5vcr923Yw1HR2DwA9GQyyzgqamH2KsYXbkXuvaZyscoC9G9t/Sssn1cyTyy6Z2cncFXZs7OzTCwGEPLFQCZTsisHGCTxWjQ6R1SquUseq6Ie2HkZqiRe6+iwqWyjgOb7dnerb+6eTRKNXGivA/BEoAdehjN/Fr+jwwYXL0HQl/17e1/XIv7xJJY1m7Kso5Rl7acikZr/wZGKROIpyzo4meNhreMDAP66cSOSsqyyCRVWKctqSllW+1XFr6uuuuqqvf4DtHiJ42XrW+MAAAAASUVORK5CYII='

//entry point
;(() => {
  'use strict'

    // register the handler
  document.addEventListener('keyup', doc_keyUp, false)

  document.addEventListener('DOMContentLoaded', e => {
    waitForElm('#main').then(()=>{
      //add spinner
      const spinner_container = spinner_setup()
      poll(expand_things, Date(), 0.5, 500)

      if(document.location.href.endsWith('ticket-console')) {
        addTitles()
        waitForElm('[ux-id="ticket-console-grid-list"]').then(() => {
          const gridListObserver = new MutationObserver(mutations => addTitles())
          gridListObserver.observe(document.querySelector('[ux-id="ticket-console-grid-list"]'), {
            childList: true,
            subtree: true
          })
        })
      }
    });
  })
})()

const EXPANDED_STATE = {
  showMoreBtn: false,
  notesTextBox: false,
}

function expand_things() {
  let showMoreBtn = document.querySelector('button[ux-id="show-more"]')
  if(EXPANDED_STATE.showMoreBtn || showMoreBtn) {
    showMoreBtn.click()
    EXPANDED_STATE.showMoreBtn = true
  } else {
    return false
  }

  let notesTextBox =  document.querySelector('[ux-id="add-note-textbox"]')
  if(EXPANDED_STATE.notesTextBox || notesTextBox) {
    notesTextBox.click()
    EXPANDED_STATE.notesTextBox = true
  } else {
    return false
  }

  const statusValue = document.querySelector('[ux-id="status-value"]')
  statusValue.focus()

  return true
}

function addTitles() {
  const cellsWithText = document.querySelectorAll('span[ng-cell-text]')
  for(let i of cellsWithText) {
    i.title = i.textContent
  }
}

/**
 * Keyboard shortcuts:
 * Ctrl + Alt + d == scrape data off workorder and copy to the clipboard for accessories sheet
 * Ctrl + Alt + s == scrape data off workorder and copy to the clipboard for purchasing sheet
 * Ctrl + Alt + g == scrape data off workorder and copy to the clipboard for cross-charge sheet
 * Ctrl + Alt + x == scrape data off collect pc ticket and copy to the clipboard
 * Ctrl + Alt + c == set workorder to completed with Reported Source = 'Self Service'
 * Ctrl + Alt + z == set workorder to Pending / Supplier Delivery
 * Ctrl + Alt + a == set workorder to In Progress
 * Ctrl + Alt + w == set asset status to Received / Storage and copy NT to clipboard
 * Ctrl + Alt + e == set asset status to Deployed / In Production
 * Ctrl + Alt + f == get the cost center for the user on the ticket
 * s == open search bar
 * Ctrl + Alt + p == debug whatever I'm working on. (in the future add a command palette)
 */
function doc_keyUp(e) {
  if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === '∂' || e.which === 68)) { // ctrl + alt + d
    scrapeAndCopy(document, 'accessories')
  } else if (e.ctrlKey && e.altKey && (e.key === 's' || e.key === 'ß' || e.which === 83)) { //ctrl + alt + s
    scrapeAndCopy(document, 'purchasing')
  } else if (e.ctrlKey && e.altKey && (e.key === 'g' || e.key === '©' || e.which === 71)) {// crtl + alt + g
    scrapeAndCopy(document, 'cross-charge')
  } else if ((e.ctrlKey && e.altKey && (e.key === 'x' || e.key === '≈' || e.which === 88)) || e.which === 106) { // ctrl + alt + x
    scrapeCollectPC(document, 'collect-pc')
  } else if (e.ctrlKey && e.altKey && (e.key === 'c' || e.key === 'ç' || e.which === 67)) { // ctrl + alt + c
    setWOStatus('Completed', '', 'Self Service')
  } else if (e.ctrlKey && e.altKey && (e.key === 'z' || e.key === 'Ω' || e.which === 90)) { // ctrl + alt + z
    setWOStatus('Pending', 'Supplier Delivery', 'Self Service')
  } else if (e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'å' || e.which === 65)) { // ctrl + alt + a
    setWOStatus('In Progress', '', '')
  } else if (e.ctrlKey && e.altKey && (e.key === 'w' || e.key === '∑' || e.which === 87)) { // ctrl + alt + w
    const nt = document.querySelector('a[ux-id="email"]').text.trim().split('@')[0]
    setAsset('Received', 'Storage')
    copyTextToClipboard(nt)
  } else if ((e.ctrlKey && e.altKey && (e.key === 'l' || e.key === '¬' || e.which === 76)) || e.which === 107) { // ctrl + alt + l
    setAsset('End of Life', 'Ready for Disposal')
  } else if (e.ctrlKey && e.altKey && (e.key === 'e' || e.key === '´' || e.which === 69)) { // ctrl + alt + e
    setAsset('Deployed', 'In Production')
  } else if (e.ctrlKey && e.altKey && (e.key === 'f' || e.key === 'ƒ' || e.which === 70)) { // ctrl + alt + f
    getCostCenter(document)
  } else if (e.ctrlKey && e.altKey && (isNumericKey(e))) { // ctrl + alt + numericKey
    let i = whatNumeralKey(e)
    let cells = getCells(i)
    copyTextToClipboard(cells)
  } else if ((e.ctrlKey && e.altKey && (e.key === 'n'))) { // ctrl + alt + n
    startAssetCollectionFromNameTags()
  } else if ((e.key === 's' || e.which === 83)) { // s
    if (
      !(e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLInputElement ||
      e.target.contentEditable === 'true')
      ) {
      focusSearch();
      document.dispatchEvent(new KeyboardEvent('keydown', {'key':'Tab'} ));
      document.dispatchEvent(new KeyboardEvent( 'keyup' , {'key':'Tab'} ));
    }
  } else if (e.ctrlKey && e.altKey && (e.key === 'p' || e.key === 'π' || e.which === 80)) { // ctrl + alt + p
    //TODO: command palette
    document.getElementById('scraper_spinner').classList.toggle('hidden')
  } else if (e.ctrlKey && e.key === '`') {
    console.log('Web Terminal!')
  }
}

function isNumericKey(e) {
  // Get the key value as a string
  var key = e.key;
  // Check if the key is a numeric character (0-9)
  return key >= '0' && key <= '9';
}

function whatNumeralKey(e) {
  // Get the key value as a string
  var key = e.key;
  // Check if the key is a numeric character (0-9)
  if (key >= '0' && key <= '9') {
      // Return the numeric value of the key
      return parseInt(key, 10);
  } else {
      // Return null or some other value to indicate a non-numeric key
      return null;
  }
}

/**
 * Scrapes a specific workorder for relevant data, organize's it to my spreadsheet's format and adds a button/keyboard shortcut to copy to clipboard
 */
async function scrapeAndCopy(document, sheet) {
  const spinner = document.getElementById('scraper_spinner')
  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden')
  }
  spinner.classList.remove('hidden')
  const title = document
    .querySelector('div[ux-id="title-bar"] div[ux-id="ticket-title-value"]')
    .textContent.trim()
  const name = document
    .querySelector('#ticket-record-summary a[ux-id="assignee-name"]')
    .text.trim()
  const email = document
    .querySelector('#ticket-record-summary a[ux-id="email-value"]')
    .text.trim()
  const ticket_number = document
    .querySelector('#ticket-record-summary div[ux-id="field_id"] span[ux-id="character-field-value"]')
    .textContent.trim()
  const URL = document.location.href
  const Ticket_ID = URL.split('/').slice(-1)[0]
  const description = document.querySelector('#ticket-record-summary div[ux-id="field_desc"] div[ux-id="field-value"]')
  const descText = description.textContent || description.innerText

  const isYubikeyRequest = title.toLowerCase().indexOf('yubikey') !== -1 || title.toLowerCase().indexOf('privileged token') !== -1
  const isLaptopRequest = title.toLowerCase().indexOf('laptop  request') !== -1 //Yes the title of laptop request has two spaces between the words...

  let yubi = '',
    signee = '',
    address = '',
    address2 = '',
    city = '',
    state = '',
    zip = '',
    country = '',
    phone = '' // default any missing info to empty strings

  if (isYubikeyRequest) {
    const priviledgedTokenRequest = /Assign YubiKey for Regular Account/
    if (!priviledgedTokenRequest.test(descText)) {
      [signee, address, city, state, zip, country, phone, yubi] = parseYubiDesc(descText)
    }
  } else if(isLaptopRequest) {
    // let shipped, address = ''
    let [signee, addr, phone_number, shipped] = parseLaptopRequestDesc(descText)
    const parsedAddress = await parseUSAddress(addr)
    address = parsedAddress.address
    city = parsedAddress.city
    state = parsedAddress.state
    zip = parsedAddress.zip
    phone = phone_number
  } else {
    const shipOrOfficeRegex = /Do you work primarily from Home or in a site without Local IT\?:(Yes|No)\n/
    const matched = descText.match(shipOrOfficeRegex)
    if( matched && !(matched[1] == 'No') ) {
      [signee, address, city, state, zip, country, phone] = parseDesc(descText)
      signee = signee.trim()
    }
  }

  const nametag = email.split('@')[0]
  const HUB_PROFILE_URL = `https://hub.corp.ebay.com/searchsvc/profile/${nametag}`
  const date = new Date().toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
  const what = yubi || ''

  let cost_center = 'default'

  let linkedTicketNumber = `${ticket_number}`
  linkedTicketNumber.link = URL

  const costCenterCode = await getCostCenterFromHub(HUB_PROFILE_URL)
  cost_center = costCenterCode


  if(signee.split(' ').length > 2) {
    notify({title:"Signee has more than 2 names", FAILURE_ICON, body:"The name and Signee are different values"})
  }
  if(signee != '' && name != signee){
    notify({title:"Name and signee are different", FAILURE_ICON, body:"The name and Signee are different values"})
  }
  let firstName, lastName = '';

  const split = name.split(' ')
  firstName = split[0]
  lastName = split[split.length-1]

  const isSoftwareRequest = title.toLowerCase().indexOf('software request') !== -1

  if(isSoftwareRequest) {
    const csvSoftwareSheet = `${date}\tSLC\t\t\t\t\t\t${linkedTicketNumber}\t${email}\t1\t\t\t\t${cost_center}\t\t\tNormal\t`
    copyTextToClipboard(csvSoftwareSheet)
  } else if (isLaptopRequest) {
    const csvLaptopRequest = `${date}\tSLC\t${what}\t1\t${linkedTicketNumber}\t${email}\t${cost_center}\t${name || signee}\t${address}\t\t${city}\t${state}\t${zip}\t${phone}\t${country || "USA"}\t\t\t\t\t\tn\t`
    copyTextToClipboard(csvLaptopRequest)
  } else if(sheet == 'accessories') {
    const csvAccessoriesSheet = `${date}\tSLC\t${what}\t1\t${linkedTicketNumber}\t${email}\t${cost_center}\t${name || signee}\t${address}\t\t${city}\t${state}\t${zip}\t${phone}\t${country || "USA"}\t\t\t\t\t\tn\t`
    copyTextToClipboard(csvAccessoriesSheet)
  } else if(sheet == 'purchasing') {
    const csvPurchasingSheet = `${date}\t${firstName}\t${lastName}\t\t\t\t${address}\t\t${city}\t${state}\t${zip}\t\t${linkedTicketNumber}\t1`
    copyTextToClipboard(csvPurchasingSheet)
  } else if (sheet == 'cross-charge') {
    const csvCrossChargeSheet = `${date}\tSLC\t${what}\t1\t${linkedTicketNumber}\t${email}\t${cost_center}`
    copyTextToClipboard(csvCrossChargeSheet)
  }

  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden')
  }
  let notif_title = 'Success!'
  let body = 'Data was scraped successfully'
  notify({ title: notif_title, SUCCESS_ICON, body })
}

async function getCostCenterFromHub(profileURL) {
  try {
    const r = await makeRequest(profileURL)
    data = JSON.parse(r).data
    return data.costCenterCode
  } catch (e) {
    console.error(e)
    let title = 'Failure!'
    let body = 'Data was not scraped successfully. Check that the hub is still logged in.'
    notify({ title, FAILURE_ICON, body })
  }
}

async function getCostCenter(document) {
    //scrape basic data
    const email = document
    .querySelector('#ticket-record-summary a[ux-id="email-value"]')
    .text.trim()
    const nametag = email.split('@')[0]

    //start loading spinner
    const spinner = document.getElementById('scraper_spinner')
    if (!spinner.classList.contains('hidden')) {
      spinner.classList.add('hidden')
    }

    //make request to hub for cost center
    const HUB_PROFILE_URL = `https://hub.corp.ebay.com/searchsvc/profile/${nametag}`
    const cost_center = await getCostCenterFromHub(HUB_PROFILE_URL)

    //stop loading spinner
    if (!spinner.classList.contains('hidden')) {
      spinner.classList.add('hidden')
    }

    //notify of success
    let notif_title = 'Success!'
    let body = 'Data was scraped successfully'
    notify({ notif_title, SUCCESS_ICON, body })

    //copy to clipboard
    copyTextToClipboard(cost_center)
}

async function scrapeCollectPC(document, sheet) {
  const spinner = document.getElementById('scraper_spinner')
  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden')
  }

  const title = document
    .querySelector('div[ux-id="title-bar"] div[ux-id="ticket-title-value"]')
    .textContent.trim()
  const name = document
    .querySelector('#ticket-record-summary a[ux-id="assignee-name"]')
    .text.trim()
  const email = document
    .querySelector('#ticket-record-summary a[ux-id="email-value"]')
    .text.trim()
  const work_order = document
    .querySelector('#ticket-record-summary div[ux-id="field_id"] span[ux-id="character-field-value"]')
    .textContent.trim()
  const description = document.querySelector('#ticket-record-summary div[ux-id="field_desc"] div[ux-id="field-value"]')
  const descText = description.textContent || description.innerText
  const parsedDesc = descText
    .split(/\r?\n/)
    .reduce((acc, item)=>{
      if(item.indexOf(':')==-1) return acc;
      let [key, value] = item.split(':');
      acc[key.trim()]=value ? value.trim() : "";
      return acc;
    }, {})
  const PEOPLEX_PROFILE_URL = `https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${parsedDesc['Login ID']}`
  const description_nt = parsedDesc['Login ID'];
  const timeline_feed = document.querySelector('div[ux-id="activity-feed"] div.timeline-feed')
  const create_date_text = [...timeline_feed.children].at(-2).querySelector('span.feed-item__date-time').textContent
  const create_date = new Date(create_date_text).toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })

  spinner.classList.remove('hidden')
  let user_data, manager_data, asset_data
  try {
    const userResponse = await makeRequest(PEOPLEX_PROFILE_URL)
    user_data = JSON.parse(userResponse)
    const managerResponse = await makeRequest(`https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${user_data.payload.managerUserId}`)
    manager_data = JSON.parse(managerResponse)
    const assetResponse = await startSearchAssetByNT(description_nt)
    asset_data = assetResponse

  } catch (e) {
    console.error(e)
    let title = 'Failure!'
    let body = 'Data was not scraped successfully. Check that the peoplex is still logged in.'
    notify({ title, FAILURE_ICON, body })
  }
  const assets = asset_data.map((a) => {
    return `<a href="https://ebay-smartit.onbmc.com/smartit/app/#/asset/${a.ID}/BMC_COMPUTERSYSTEM">${a.sn}</a>`
  }).join(',')
  const manager_email = manager_data.payload.email
  const template = ((userSrcSys) => {
    if(userSrcSys == 'FG') {
      return "MM AWF"
    } else {
      return "MM FTE"
    }
  })(user_data.payload.userSrcSys)
  const csvCollectPCSheet = `${work_order}\t${name}\t${parsedDesc['Login ID']}\t${parsedDesc['Manager Name']}\t${manager_email}\t${assets}\t\tTODO\t${create_date}\t${user_data.payload.userSrcSys}\t${user_data.payload.costctrCd}\t${template}`
  const html_csvCollectPCSheet = convertPlainTextToHTMLTable(csvCollectPCSheet)
  copyTextToClipboard(html_csvCollectPCSheet, "text/html")
  spinner.classList.add('hidden')
}



/* Example Description:
  Headsets & Webcams: ["[Standard] Wired Headset"]
  Can't find your Computer Name?  Please enter here::Dell Optiplex 7080
  Do you work primarily from Home or in a site without Local IT?:Yes
  IS VIP?:No
  Street Address:583 eBay Way
  Country:United States
  State/Province:Utah
  Preferred Contact Number:8011234567
  City:Draper
  Postal Code:84020
  Name of Individual who will sign for packages:John Smith
*/
/**
 * Parses general workorder and returns each item in an array.
 */
function parseDesc(description) {
  const signee = description.match(/Name of Individual who will sign for packages:(.*?)(Show more|\sShow less|\n|$)/)[1]
  if(/Preferred Contact Number:/.test(description)) {
    const addr = description.match(/Street Address:(.*?)\n/)[1]
    const countryMatch = description.match(/Country:(.*?)\n/)[1]
    const country = (countryMatch.toLowerCase().includes("united") && countryMatch.toLowerCase().includes("states")) ? "USA" : countryMatch
    const state = description.match(/State\/Province:(.*?)\n/)[1]
    const phone = description.match(/Preferred Contact Number:(.*?)\n/)[1] ?? "n/a"
    const city = description.match(/City:(.*?)\n/)[1]
    const zip = description.match(/Postal Code:(.*?)\n/)[1]
    return [signee, addr, city, state, zip, country, phone]
  } else if(/Phone Number:/.test(description)) {
    const addr = description.match(/Shipping Address:(.*?)\n/)[1]
    const phone = description.match(/Phone Number:(.*?)\n/)[1]
    return [signee, addr, '', '', '', '', phone]
  }
}

/**
 * Parses the description on a yubikey workorder and returns each item in an array.
 */
function parseYubiDesc(description) {
  const yubiType = description.match(/Do you want a Standard USB Yubikey, or the USB-c type\? : (USB|USB-c)\n/)[1]
  const yubi = yubiType === 'USB' ? 'Yubikey' : 'Yubikey USB-C'
  const shipOrOfficeRegex = /Where would you like your Yubikey shipped\? : (.*?)(Request\sType|\n|$)/
  if (description.match(shipOrOfficeRegex)[1] != 'Desk Location') {
    const signee = description.match(/Name : (.*)\n/)[1]
    const addr = description.match(/Street Address : (.*)\n/)[1]
    const city = description.match(/City : (.*?)\n/)[1]
    const state = description.match(/State\\\\Province : (.*?)\n/)[1]
    const zip = description.match(/Postal Code : (.*?)\n/)[1]
    const countryMatch = description.match(/Country : (.*?)\n/)[1]
    const country = (countryMatch.toLowerCase().includes("united") && countryMatch.toLowerCase().includes("states")) ? "USA" : countryMatch
    const phone = description.match(/Phone Number : (.*?)(Show more|\sShow less|\n|$)/)[1]
    return [signee, addr, city, state, zip, country, phone, yubi]
  }
  //      signee, addr, city, state, zip, country, phone, yubi
  return ['',     '',   '',   '',    '',  '',      '',    yubi]
}

function parseLaptopRequestDesc(description) {
  const shipped = description.match(/Would you like it shipped to you\? : (Yes|No, I will pickup from my local office) \n/)[1]
  if(shipped === 'Yes') {
    const address = description.match(/Shipping Address : ((.|\n)*)\nPhone Number/)[1]
    const signee = description.match(/Name of Individual who will sign for packages : (.*?)\n/)[1]
    const phone = description.match(/Phone Number : (.*)\n/)[1]
    return [signee, address, phone, shipped]
  }
  return ['', '', '', shipped]
}

function parseUSAddress(addr) {
  addr = addr.trim().replace('\n',',')
  const parts = addr.split(",")
  const zipRegex = /^\d{5}(?:[-\s]\d{4})?$/
  const stateRegex = /^[A-Z]{2}$/
  let address = ""
  let city = ""
  let state = ""
  let zip = ""

  // Parse address line 1 and 2
  if (parts.length >= 1) {
    address = parts[0].trim()
  }

  // Parse city, state, and zip
  if (parts.length >= 2) {
    const stateZip = parts[parts.length - 1].trim()
    const stateZipParts = stateZip.split(" ")
    city = parts[1]

    if (stateZipParts.length > 1 && stateRegex.test(stateZipParts[stateZipParts.length - 2])) {
      state = stateZipParts[stateZipParts.length - 2]
    }
    if (stateZipParts.length > 1 && zipRegex.test(stateZipParts[stateZipParts.length - 1])) {
      zip = stateZipParts[stateZipParts.length - 1]
    }
  }

  return {
    address: address,
    city: city,
    state: state,
    zip: zip
  };
}

/**
 * Clicks status element then set's status to $status, status reason to $reason and reported source to $source.
 */
async function setWOStatus(status='Completed', reason, source) {
  const statusBtn = document.querySelector('#ticket-record-summary div[ux-id="status-value"]')
  statusBtn?.click()
  const statusDropdown = document.querySelector(`#ticket-record-summary div[ux-id="status-dropdown"] ul li a[aria-label="${status}"]`)
  statusDropdown?.click()
  await wait(100)
  setReason(reason)
  setSource(source)
}

function setReason(reason) {
  if(reason == '') return
  const reasonDropdown = document.querySelector(`#ticket-record-summary div[ux-id="status-reason-dropdown"] label ul li a[aria-label="${reason}"]`)
  reasonDropdown?.click()
}

function setSource(source) {
  if(source == '') return
  const sourceDropdown = document.querySelector(`#ticket-record-summary div[ux-id="field_reported_source"] label ul li a[aria-label="${source}"]`)
  sourceDropdown?.click()
}

function focusSearch() {
  const searchBtn = document.querySelector('#header-search_button')
  searchBtn.click()
  //Automatically set to 'All'
  const searchTypeBtn = document.querySelector('div[ux-id="global-search-dropdown"] ul li a[aria-label="All"]')
  searchTypeBtn.click()
  const searchInput = document.querySelector('input[ux-id="search-text"]')
  searchInput.focus()
}

async function setAsset(status, reason) {
  const statusBtn = document.querySelector('div[ux-id="status-value"]')
  statusBtn?.click()
  const statusDropdown = document.querySelector(`div[ux-id="status-dropdown"] ul li a[aria-label="${status}"]`)
  statusDropdown?.click()
  await wait(100)
  setAssetReason(reason)
}

function setAssetReason(reason) {
  if(reason == '') return
  const reasonDropdown = document.querySelector(`div[ux-id="status-reason-dropdown"] label ul li a[aria-label="${reason}"]`)
  reasonDropdown?.click()
}

function getCells(i) {
  let data = getDataFromCells()
  let text = ''
  data.forEach(row => {
    const cell = row[i]
    text = text.concat(`${cell}\n`)
  })
  return text
}

function getDataFromCells() {
  let rows = document.querySelectorAll('div[ng-row]')
  let data = []
  
  rows.forEach((row, rIdx) => {
    data.push([])
    let cells = row.querySelectorAll('div[ng-cell] span[ng-cell-text]')
    cells.forEach(cell => data[rIdx].push(cell.outerText))
  })
  return data
}

const ROUTE_APP_PREFIX =  "https://ebay-smartit.onbmc.com/smartit/app/#"
const ROUTE_REST_PREFIX = "https://ebay-smartit.onbmc.com/smartit/rest"
const ROUTES = {
  searchAsset: (Q) => `${ROUTE_REST_PREFIX}/globalsearch?chunk_index=0&chunk_size=50&search_text=${Q}&suggest_search=true`,
  search: (SEARCH_QUERY) => `${ROUTE_APP_PREFIX}/search/${SEARCH_QUERY}`, // query must be url encoded
  workOrder: (ID) => `${ROUTE_APP_PREFIX}/workorder/${ID}`, // WOGDHWUVDUMKRAS1NHM1S1NHM1PA41 => 30
  incident: (ID) => `${ROUTE_APP_PREFIX}/incident/${ID}`, // IDGG1QUMAPMURAS12DSCS12DSC0Z7Q => 30
  task: (ID) => `${ROUTE_APP_PREFIX}/task/${ID}`, // TMGDHWUVDUMKRAS1NHM2S1NHM2PA6F => 30
  ticketConsole: () => `${ROUTE_APP_PREFIX}/ticket-console`,
  allAssets: (NT) => `${ROUTE_REST_PREFIX}/asset/${NT}?allAssets=true`,
  asset: (ID) => `${ROUTE_REST_PREFIX}/asset/details/${ID}/BMC_COMPUTERSYSTEM`, //OI-621BD3CE368211EEB92ABAD6D1CD7F55 => 
}

async function startAssetCollectionFromNameTags() {
  try {
    const clipboardContents = await navigator.clipboard.read()
    const blob = await clipboardContents[0].getType('text/plain')
    const text = await blob.text()
    let parsed, NTS = null
    if(text.includes('\t')) {
      parsed = text.trim().split(/\r?\n/)
        .map(line => line.split('\t'))
        .map(line => {
            if(line[3].includes(',')){
                return [line[0], (line[3].split(',').map(s => s.trim()))]
            } else {
                return [line[0], [line[3].trim()]]
            }
        })
        .reduce((prev, curr) => ({...prev, [curr[0]]:curr[1]}), {})
        NTS = Object.keys(parsed)

    } else {
      NTS = text.trim().split(/\r?\n/)
    }

    let results = await getAssetsInfo(NTS)
    results = results
      .map(r => r.value)
      .flat()
      .filter(v => v.status != "Disposed" && v.owned == "ownedby" && v.sn != undefined)

    if(text.includes('\t')){
      results = results
        .filter(r => parsed[r.nt].includes(r.sn))

      const copy = results
        .reduce((prev, curr) => {
          if(prev.length != 0 && curr.nt == prev[prev.length-1].nt) {
            prev[prev.length - 1] = {...prev[prev.length - 1], status:`${prev[prev.length - 1].status}, ${curr.status}`}
            // prev[prev.length - 1].status += ` ${curr.status}`
            return prev
          } else {
            prev.push(curr)
            return prev
          }
        }, [])
        .map(r => r.status).join('\n')
      const cBlob = new Blob([copy], {type:"text/plain"})
      const data = [new ClipboardItem({ ['text/plain']: cBlob})]
      await navigator.clipboard.write(data)
      console.log(copy)
    }
    console.log(results)
  } catch(e) {
    console.log(e)
  }
}

async function getAssetsInfo(NTS) {
 try {
  const promises = NTS.map(NT => getAssetInfo(NT))
  const r = await Promise.allSettled(promises)
  return r
 } catch(e) {
  console.log(e)
 }
}

async function getAssetInfo(NT) {
  const r = await makeRequest(ROUTES.allAssets(NT))
  const j = await JSON.parse(r)
  const results = filterReleventAssetInfo(j)
  return results
}

function filterReleventAssetInfo(r_json) {
  results = [];
  r_json.forEach( j => {
    j.items.forEach(item => {
        item.objects.forEach(object => {
            let r = { 
              status:object.status.value, 
              nt: object.owner.loginId,
              sn:object.serialNumber, 
              fullName: object.owner.fullName,
              id: object.reconciliationId, 
              name:object.name, 
              owned: object.role,
              model:object.product.name, 
            }
            results.push(r)
        })
    })
  });
  return results;
}

async function startSearchAssetByNT() {
  const NT = document.querySelector('a[ux-id="email-value"]').text.trim().split('@')[0]
  let results = await getAssetInfo(NT)
  results = results
  // .map(r => r.value)
  // .flat()
  .filter(v => v.status != "Disposed" && v.owned == "ownedby")
  console.log(results)
  return results
}

async function startAssetCollectionFromSerials() {
  try {
    const clipboardContents = await navigator.clipboard.read()
    const blob = await clipboardContents[0].getType('text/plain')
    const text = await blob.text()
    const serials = text.trim().split(/\r?\n/)
      .reduce((acc, sn) => {
        if(sn.includes(',')) {
          acc.push.apply(acc, sn.split(','))
          return acc
        } else {
          acc.push(sn.trim())
          return acc
        }
      }, [])
    let results = await assetsSearch(serials)
    results = results
      // .map(r => r.value)
      // .flat()
      .filter(v => v.status != "Disposed")
    console.log(results)
    return results
  } catch(e) {
    console.log(e)
  }
}

async function startSearchAssetBySN() {
  const clipboardContents = await navigator.clipboard.read()
  const blob = await clilpboardContents[0].getType('text/plain')
  const text = await blob.text()
  const SNS = text.trim().split(/\r?\n/)
  let results = await assetsSearch(SNS)
  results = results
    .map(r => r.value)
  console.log(results)
  return results
}

async function assetsSearch(SNS) {
  try {
    const promises = SNS.map(SN => assetSearch(SN))
    const r = await Promise.allSettled(promises)
    return r
  } catch (e) {
    console.log(e)
  }
}

async function assetSearch(SN) {
  const r = await makeRequest(ROUTES.searchAsset(encodeURI(SN)), "POST", {types: ["asset"]}) //TODO: add payload {types: ["asset"]}
  const j = await JSON.parse(r)
  const results = filterReleventAssetSearchInfo(j)
  return results
}

function filterReleventAssetSearchInfo(r_json) {
  results = []
  r_json.forEach( j => {
    j.items.forEach(item => {
      item.results.forEach(res => {
        let result = res.additionalInformation
        let r = {
          manufacturer: result.manufacturer,
          product: result.product.name,
          SN: result.serialNumber,
          ID: result.reconciliationId,
          hostname: result.name,
          status: result.status.value,
          statusReason: result.status.reason,
          type: result.type,
          desc: res.desc,
        }
        results.push(r)
      })
    })
  })
  return results
}

