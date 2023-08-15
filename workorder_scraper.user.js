// ==UserScript==
// @name         Scrape Workorder Data
// @namespace    https://hixon.dev
// @version      0.1.74
// @description  Various automations to workorder pages
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
 * 
*/


// Constants
const SUCCESS_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAbUlEQVRIiWNgGE7Am4GB4QkDA8N/MjFB8JgCw4mygGiFpAAmahtIigXkxsljBgYGT2wGogcRJXHyiBgLyI0TFH0DGgejFoxaMFIsYEFiM9LCggENoidQmpyK5zExlnsykFeiPmJgYPAgxoKhAQAobmMW+E0ohwAAAABJRU5ErkJggg=='
const FAILURE_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAEi0lEQVRoge2ZTU8bVxSG33NpU5WCKCUTY4TUWBDCh+hiZmE2LMKCOwKFIqxIbQqb/ICA2k35B+2qVf9D1aZVUkWVgqgrpQsWYVEWVIaqRsIIRIlg4YliyxH4nC74ECB7fMdjFpX8Sl5Yc+fc9xnfc+fcY6Cuuuqq63+j3PRUVB5MNF9VfHkw0ZybnooGuUeZDizMJB4qUtuFw2ub+ZlEPLg9f+VnEvHC4bVNRWq7MH1v1vQ+Mgr+2dQcBN+cfhfIKyLSjd8/eVGN2cvK3Z90CA1JQFrPjAnNv/vD468q3VsRIP/p5JycM39Or0iUbnwUDiJ3f9IBIwmg9fI1EZpvevSLL4QvwOt7E7MgfOszxFOKdOOPT5fN7F5U/pOP48yyCKCl3BgBzTb/9PS7ctfLAuSmdJTV29sAGvxtkMdS1C2PnwWC8BJjcUUNi4CUNX+iIhF3Nv38bK/UxbJJnD9657VwMSvM8P8UW0iw6CXGjBPbS4zFSbAoXGwxiJ/NI/+6XCzfJZSd0jYxJQF8YOILityWJwu+OZGdHHUIquSaryZmxSTO3tU2IMYQBHZbfv295ITZ8VEHqnTCBo11KqNtNHtX28JsDMEsbtvCxYmz46OOHD8II/OlYpSSEQAAZPWIzcp8OQnozEB2/I7DfHGfN723kowBAGBfj9gqwHKCEpeLdKjIfNlAidu28IfxuyUQAAAcjN6JQ9h3775g6FhmY0np6789D7QdBwYAgP2RYRvHT9XklzCRRyz6+vOlwC/EqgCAYwgWTlJoCPIY0O1VmAdCAADA/vCQzWSc2KXkCYtuX3pRlXkgJAAA7A4P2UqME/u8PIBCmQdqAAAAu0OOTUoFgfBIsW5f+jOUeQB4K2wAAIAIMYMAMRpOAIpFqcnDC7+E4rbDYrzPn5cHgtu5vBLqPBEKYMu2HdXASUhg86fyiJXbuVI9RNUAW/agQ0LVPPnL8hTB7VxZrQqiKoCtwUEHyrgwM5HHotzYanCIwACbH/XHScjkJAWATkoJs7FComOra1dXSmwN9jpc5gBeQh5EaRI5FBWgAGRyY+vrtS/mNnp7HUVsfhgh0bG19DIAZPq6bYbxe8IjsBtb36hdOb3R2xUkYT3FpGPp9IWlkO7rthUbF4CeUjCCqAiw0dXloAGmW6XHULrnkvlTpbu7bRCSBDE7FAm5tzb8IXwBNrq6HBHzZSMsuieT8U3CdPeHNth8OYHFvZXJBD/U/337drN6U9gE0GY0Eaii+VP9c/NmHPBvaJ1JcHDYlI8NpPZLtlbK9oW4UGgS5vcr923Yw1HR2DwA9GQyyzgqamH2KsYXbkXuvaZyscoC9G9t/Sssn1cyTyy6Z2cncFXZs7OzTCwGEPLFQCZTsisHGCTxWjQ6R1SquUseq6Ie2HkZqiRe6+iwqWyjgOb7dnerb+6eTRKNXGivA/BEoAdehjN/Fr+jwwYXL0HQl/17e1/XIv7xJJY1m7Kso5Rl7acikZr/wZGKROIpyzo4meNhreMDAP66cSOSsqyyCRVWKctqSllW+1XFr6uuuuqqvf4DtHiJ42XrW+MAAAAASUVORK5CYII='

;(() => {
  'use strict'
    // register the handler
  document.addEventListener('keyup', doc_keyUp, false)

  document.addEventListener('DOMContentLoaded', e => {
    //add spinner
    const spinner_container = spinner_setup()
    poll(expand_things, Date(), 0.5, 500)
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

function poll(work_func, first_attempt_time, max_attempt_minutes, frequency) {
  let firstAttempt = new Date(first_attempt_time)
  if((first_attempt_time + new Date(firstAttempt.getTime() + max_attempt_minutes*60000)) < new Date()) return

  let work_result = work_func();
  if(!work_result) {
    setTimeout(poll, frequency, work_func, first_attempt_time, max_attempt_minutes, frequency)
  }

}

/**
 * Keyboard shortcuts:
 * Ctrl + Alt + d == scrape data off workorder and copy to the clipboard
 * Ctrl + Alt + c == set workorder to completed with Reported Source = Web
 * Ctrl + Alt + p == debug whatever I'm working on. (in the future add a command palette)
 * Ctrl + Alt + x == scrape data off collect pc ticket and copy to the clipboard
 */
function doc_keyUp(e) {
  if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === '∂' || e.which === 68)) {
    scrapeAndCopy(document, 'accessories')
  } else if (e.ctrlKey && e.altKey && (e.key === 's' || e.key === 'ß' || e.which === 83)) {
    scrapeAndCopy(document, 'purchasing')
  } else if (e.ctrlKey && e.altKey && (e.key === 'g' || e.key === '©' || e.which === 71)) {
    scrapeAndCopy(document, 'cross-charge')
  } else if (e.ctrlKey && e.altKey && (e.key === 'x' || e.key === '≈' || e.which === 88)) {
    scrapeCollectPC(document, 'collect-pc')
  } else if (e.ctrlKey && e.altKey && (e.key === 'c' || e.key === 'ç' || e.which === 67)) {
    setWOStatus('Completed', '', 'Self Service')
  } else if (e.ctrlKey && e.altKey && (e.key === 'z' || e.key === 'Ω' || e.which === 90)) {
    setWOStatus('Pending', 'Supplier Delivery', 'Self Service')
  } else if (e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'å' || e.which === 65)) {
    setWOStatus('In Progress', '', '')
  } else if (e.ctrlKey && e.altKey && (e.key === 'w' || e.key === '∑' || e.which === 87)) {
    const nt = document.querySelector('a[ux-id="email"').text.trim().split('@')[0]
    setAsset('Received', 'Storage')
    copyTextToClipboard(nt)
  } else if (e.ctrlKey && e.altKey && (e.key === 'e' || e.key === '´' || e.which === 69)) {
    setAsset('Deployed', 'In Production')
  } else if (e.ctrlKey && e.altKey && (e.key === 'f' || e.key === 'ƒ' || e.which === 70)) {
    getCostCenter(document)
  } else if ((e.key === 's' || e.which === 83)) {
    if (
      !(e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLInputElement ||
      e.target.contentEditable === 'true')
      ) {
      focusSearch();
    }
  } else if (e.ctrlKey && e.altKey && (e.key === 'p' || e.key === 'π' || e.which === 80)) {
    //TODO: command palette
    document.getElementById('scraper_spinner').classList.toggle('hidden')
  }
}

/**
 * Scrapes a specific workorder for relevant data, organize's it to my spreadsheet's format and adds a button/keyboard shortcut to copy to clipboard
 */
function scrapeAndCopy(document, sheet) {
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

  const isYubikeyRequest = title.toLowerCase().indexOf('yubikey') !== -1 || title.toLowerCase().indexOf('privileged token') !== -1
  let yubi = '',
    signee = '',
    addr = '',
    city = '',
    state = '',
    zip = '',
    country = '',
    phone = '' // default any missing info to empty strings

  if (isYubikeyRequest) {
    const priviledgedTokenRequest = /Assign YubiKey for Regular Account/
    if (!priviledgedTokenRequest.test(descText)) {
      [signee, addr, city, state, zip, country, phone, yubi] = parseYubiDesc(descText)
    }
  } else {
    const shipOrOfficeRegex = /Do you work primarily from Home or in a site without Local IT\?:(Yes|No)\n/
    const matched = descText.match(shipOrOfficeRegex)
    if( matched && !(matched[1] == 'No') ) {
      [signee, addr, city, state, zip, country, phone] = parseDesc(descText)
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

  spinner.classList.remove('hidden')
  GM.xmlhttpRequest({
    url: HUB_PROFILE_URL,
    method: 'GET',
    onload: ((r) => {
      let data
      try {
        data = JSON.parse(r.response).data
      } catch (e) {
        let title = 'Failure!'
        let body = 'Data was not scraped successfully. Check that the hub is still logged in.'
        notify({ title, FAILURE_ICON, body })
        return
      }
      if(signee.split(' ').length > 2) {
        notify({title:"Signee has more than 2 names", FAILURE_ICON, body:"The name and Signee are different values"})
      }
      if(signee != '' && name != signee){
        notify({title:"Name and signee are different", FAILURE_ICON, body:"The name and Signee are different values"})
      }
      cost_center = data.costCenterCode
      let firstName, lastName = '';
      
      const split = name.split(' ')
      firstName = split[0]
      lastName = split[split.length-1]
      
      if(sheet == 'accessories') {
        const csvAccessoriesSheet = `${date}\tSLC\t${what}\t1\t${work_order}\t${email}\t${cost_center}\t${name || signee}\t${addr}\t\t${city}\t${state}\t${zip}\t${phone}\t${country || "USA"}\t\t\t\t\t\tn\t`
        copyTextToClipboard(csvAccessoriesSheet)
      } else if(sheet == 'purchasing') {
        const csvPurchasingSheet = `${date}\t${firstName}\t${lastName}\t\t\t\t${addr}\t\t${city}\t${state}\t${zip}\t\t${work_order}\t1`
        copyTextToClipboard(csvPurchasingSheet)
      } else if (sheet == 'cross-charge') {
        const csvCrossChargeSheet = `${date}\tSLC\t${what}\t1\t${work_order}\t${email}\t${cost_center}`
        copyTextToClipboard(csvCrossChargeSheet)
      }

      if (!spinner.classList.contains('hidden')) {
        spinner.classList.add('hidden')
      }
      let title = 'Success!'
      let body = 'Data was scraped successfully'
      notify({ title, SUCCESS_ICON, body })
    })
  })
}

function getCostCenter(document) {
  const spinner = document.getElementById('scraper_spinner')
  if (!spinner.classList.contains('hidden')) {
    spinner.classList.add('hidden')
  }
  const email = document
  .querySelector('#ticket-record-summary a[ux-id="email-value"]')
  .text.trim()
  const nametag = email.split('@')[0]
  const HUB_PROFILE_URL = `https://hub.corp.ebay.com/searchsvc/profile/${nametag}`
  GM.xmlhttpRequest({
    url: HUB_PROFILE_URL,
    method: 'GET',
    onload: ((r) => {
      let data
      try {
        data = JSON.parse(r.response).data
      } catch (e) {
        let title = 'Failure!'
        let body = 'Data was not scraped successfully. Check that the hub is still logged in.'
        notify({ title, FAILURE_ICON, body })
        return
      }
      cost_center = data.costCenterCode
      if (!spinner.classList.contains('hidden')) {
        spinner.classList.add('hidden')
      }
      let title = 'Success!'
      let body = 'Data was scraped successfully'
      notify({ title, SUCCESS_ICON, body })
      copyTextToClipboard(cost_center)
    })
  })
}

function scrapeCollectPC(document, sheet) {
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
    .split('\n')
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
  GM.xmlhttpRequest({
    url: PEOPLEX_PROFILE_URL,
    method: 'GET',
    onload: ((userResponse) => {
      let user_data
      try {
        user_data = JSON.parse(userResponse.response)
      } catch (e) {
        let title = 'Failure!'
        let body = 'Data was not scraped successfully. Check that the peoplex is still logged in.'
        notify({ title, FAILURE_ICON, body })
        return
      }
      GM.xmlhttpRequest({
        url: `https://peoplex.corp.ebay.com/peoplexservices/myteam/userdetails/${user_data.payload.managerUserId}`,
        method: 'GET',
        onload: ((managerResponse) => {
          let manager_data
          try{
            manager_data = JSON.parse(managerResponse.response)
          } catch (e) {
            let title = 'Failure!'
            let body = 'Data was not scraped successfully. Check that the peoplex is still logged in.'
            notify({ title, FAILURE_ICON, body })
            return
          }
          const manager_email = manager_data.payload.email
          const csvCollectPCSheet = `${work_order}\t${name}\t${parsedDesc['Login ID']}\t${parsedDesc['Manager Name']}\t${manager_email}\t\t\t${create_date}\t${user_data.payload.userSrcSys}`
          copyTextToClipboard(csvCollectPCSheet)

          if (!spinner.classList.contains('hidden')) {
            spinner.classList.add('hidden')
          }
          let title = 'Success!'
          let body = 'Data was scraped successfully'
          notify({ title, SUCCESS_ICON, body })
          })
      })
    })
  })
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