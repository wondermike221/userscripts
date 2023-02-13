// ==UserScript==
// @name         Scrape Workorder Data
// @namespace    https://hixon.dev
// @version      0.1.55
// @description  Various automations to workorder pages
// @match        https://ebay-smartit.onbmc.com/smartit/app/
// @match        https://hub.corp.ebay.com/
// @icon         https://www.google.com/s2/favicons?domain=docs.bmc.com
// @grant        GM.xmlhttpRequest
// @require      https://raw.githubusercontent.com/wondermike221/userscripts/main/lib.js
// @connect      *
// @connect      https://hub.corp.ebay.com/searchsvc/profile/*
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/wondermike221/userscripts/main/workorder_scraper.user.js
// @homepageURL  https://github.com/wondermike221/userscripts
// ==/UserScript==

/** TODOS
 * [ ] scrape multiple workorders at once using the checkboxes
 * [x] get the actual last name not just the second item in the name.split(' ')
 * [x] expand description on page load
 * [x] press 's' to search
 * 
*/


// Constants
const SUCCESS_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAbUlEQVRIiWNgGE7Am4GB4QkDA8N/MjFB8JgCw4mygGiFpAAmahtIigXkxsljBgYGT2wGogcRJXHyiBgLyI0TFH0DGgejFoxaMFIsYEFiM9LCggENoidQmpyK5zExlnsykFeiPmJgYPAgxoKhAQAobmMW+E0ohwAAAABJRU5ErkJggg=='
const FAILURE_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAAEi0lEQVRoge2ZTU8bVxSG33NpU5WCKCUTY4TUWBDCh+hiZmE2LMKCOwKFIqxIbQqb/ICA2k35B+2qVf9D1aZVUkWVgqgrpQsWYVEWVIaqRsIIRIlg4YliyxH4nC74ECB7fMdjFpX8Sl5Yc+fc9xnfc+fcY6Cuuuqq63+j3PRUVB5MNF9VfHkw0ZybnooGuUeZDizMJB4qUtuFw2ub+ZlEPLg9f+VnEvHC4bVNRWq7MH1v1vQ+Mgr+2dQcBN+cfhfIKyLSjd8/eVGN2cvK3Z90CA1JQFrPjAnNv/vD468q3VsRIP/p5JycM39Or0iUbnwUDiJ3f9IBIwmg9fI1EZpvevSLL4QvwOt7E7MgfOszxFOKdOOPT5fN7F5U/pOP48yyCKCl3BgBzTb/9PS7ctfLAuSmdJTV29sAGvxtkMdS1C2PnwWC8BJjcUUNi4CUNX+iIhF3Nv38bK/UxbJJnD9657VwMSvM8P8UW0iw6CXGjBPbS4zFSbAoXGwxiJ/NI/+6XCzfJZSd0jYxJQF8YOILityWJwu+OZGdHHUIquSaryZmxSTO3tU2IMYQBHZbfv295ITZ8VEHqnTCBo11KqNtNHtX28JsDMEsbtvCxYmz46OOHD8II/OlYpSSEQAAZPWIzcp8OQnozEB2/I7DfHGfN723kowBAGBfj9gqwHKCEpeLdKjIfNlAidu28IfxuyUQAAAcjN6JQ9h3775g6FhmY0np6789D7QdBwYAgP2RYRvHT9XklzCRRyz6+vOlwC/EqgCAYwgWTlJoCPIY0O1VmAdCAADA/vCQzWSc2KXkCYtuX3pRlXkgJAAA7A4P2UqME/u8PIBCmQdqAAAAu0OOTUoFgfBIsW5f+jOUeQB4K2wAAIAIMYMAMRpOAIpFqcnDC7+E4rbDYrzPn5cHgtu5vBLqPBEKYMu2HdXASUhg86fyiJXbuVI9RNUAW/agQ0LVPPnL8hTB7VxZrQqiKoCtwUEHyrgwM5HHotzYanCIwACbH/XHScjkJAWATkoJs7FComOra1dXSmwN9jpc5gBeQh5EaRI5FBWgAGRyY+vrtS/mNnp7HUVsfhgh0bG19DIAZPq6bYbxe8IjsBtb36hdOb3R2xUkYT3FpGPp9IWlkO7rthUbF4CeUjCCqAiw0dXloAGmW6XHULrnkvlTpbu7bRCSBDE7FAm5tzb8IXwBNrq6HBHzZSMsuieT8U3CdPeHNth8OYHFvZXJBD/U/337drN6U9gE0GY0Eaii+VP9c/NmHPBvaJ1JcHDYlI8NpPZLtlbK9oW4UGgS5vcr923Yw1HR2DwA9GQyyzgqamH2KsYXbkXuvaZyscoC9G9t/Sssn1cyTyy6Z2cncFXZs7OzTCwGEPLFQCZTsisHGCTxWjQ6R1SquUseq6Ie2HkZqiRe6+iwqWyjgOb7dnerb+6eTRKNXGivA/BEoAdehjN/Fr+jwwYXL0HQl/17e1/XIv7xJJY1m7Kso5Rl7acikZr/wZGKROIpyzo4meNhreMDAP66cSOSsqyyCRVWKctqSllW+1XFr6uuuuqqvf4DtHiJ42XrW+MAAAAASUVORK5CYII='

;(() => {
  'use strict'
  // request_interceptor()


  // register the handler
  document.addEventListener('keyup', doc_keyUp, false)

  document.addEventListener('DOMContentLoaded', e => {
    //add spinner
    const spinner_container = spinner_setup()
    expand_description(Date())
  })
})()

function request_interceptor() {
  // monkey patch fetch
  const { fetch: originalFetch } = window
  window.fetch = async (...args) => {
    let [resource, config ] = args

    // request interceptor here
    // resource = 'https://jsonplaceholder.typicode.com/todos/2'
    

    const response = await originalFetch(resource, config)

    // response interceptor here
    // const json = () => response.clone().json().then(data => ({...data, title: `Intercepted: ${data.title}` }))
    console.log(`Intercepted call to ${resource} with response ${response.clone()}`)

    // return the response for the caller.
    return response
  }

  //monkey patch xhr
  (function(xhr) {
    function the_patch(xhrInstance) { // Example
        console.log('Monkey RS: ' + xhrInstance.readyState)
        console.log(`Intercepted call to ${xhrInstance} with response ${1}`)
    }
    // Capture request before any network activity occurs:
    var send = xhr.send
    xhr.send = function(data) {
        var rsc = this.onreadystatechange
        if (rsc) {
            // "onreadystatechange" exists. Monkey-patch it
            this.onreadystatechange = function() {
                the_patch(this)
                return rsc.apply(this, arguments)
            }
        }
        return send.apply(this, arguments)
    }
  })(XMLHttpRequest.prototype)
}

async function expand_description(first_attempt_time) {
  //stop the poll after 1 minute
  const minutes = 1
  let firstAttempt = new Date(first_attempt_time)
  if((first_attempt_time + new Date(firstAttempt.getTime() + minutes*60000)) < new Date()) return
  
  let showMoreBtn = document.querySelector('button[ux-id="show-more"]')
  if(showMoreBtn) {
    showMoreBtn.click()
  } else {
    setTimeout(expand_description, 500)
  }
}

/**
 * Keyboard shortcuts:
 * Ctrl + Alt + d == scrape data off workorder and copy to the clipboard
 * Ctrl + Alt + c == set workorder to completed with Reported Source = Web
 * Ctrl + Alt + p == debug whatever I'm working on. (in the future add a command palette)
 */
function doc_keyUp(e) {
  if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === '∂' || e.which === 68)) {
    scrapeAndCopy(document, 'accessories')
  } else if (e.ctrlKey && e.altKey && (e.key === 's' || e.key === 'ß' || e.which === 83)) {
    scrapeAndCopy(document, 'purchasing')
  } else if (e.ctrlKey && e.altKey && (e.key === 'g' || e.key === '©' || e.which === 71)) {
    scrapeAndCopy(document, 'cross-charge')
  } else if (e.ctrlKey && e.altKey && (e.key === 'x' || e.key === '≈' || e.which === 88)) {
    scrapeCheckedAndCopy()
  } else if (e.ctrlKey && e.altKey && (e.key === 'c' || e.key === 'ç' || e.which === 67)) {
    setWOStatus('Completed', '', 'Web')
  } else if (e.ctrlKey && e.altKey && (e.key === 'z' || e.key === 'Ω' || e.which === 90)) {
    setWOStatus('Pending', 'Supplier Delivery', '')
  } /*else if ((e.key === 's' || e.which === 83)) {
    focusSearch();
  } */else if (e.ctrlKey && e.altKey && (e.key === 'p' || e.key === 'π' || e.which === 80)) {
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
    if( !(descText.match(shipOrOfficeRegex)[1] == 'No') ) {
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
      if(signee != '' && name != signee){
        notify({title:"Name and signee are different", FAILURE_ICON, body:"The name and Signee are different values"})
      }
      cost_center = data.costCenterCode
      let firstName, lastName = '';
      if(signee != '') {
        const split = signee.split(' ')
        firstName = split[0]
        lastName = split[split.length-1]
      } else {
        const split = name.split(' ')
        firstName = split[0]
        lastName = split[split.length-1]
      }
      const csvAccessoriesSheet = `${date}\tSLC\t${what}\t1\t${work_order}\t${email}\t${cost_center}\t${signee || name}\t${addr}\t\t${city}\t${state}\t${zip}\t${phone}\t${country || "USA"}\t\t\t\t\t\tn\t`
      const csvPurchasingSheet = `${date}\t${firstName}\t${lastName}\t\t\t\t${addr}\t\t${city}\t${state}\t${zip}\t\t${work_order}\t1`
      const csvCrossChargeSheet = `${date}\tSLC\t${what}\t1\t${work_order}\t${email}\t${cost_center}`
      
      if(sheet == 'accessories') {
        copyTextToClipboard(csvAccessoriesSheet)
      } else if(sheet == 'purchasing') {
        copyTextToClipboard(csvPurchasingSheet)
      } else if (sheet == 'cross-charge') {
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

// const WORK_ORDER_URL_LAYOUT = `https://ebay-smartit.onbmc.com/smartit/app/#/workorder/${id}`
// const WORK_ORDER_REST_URL = `https://ebay-smartit.onbmc.com/rest/v2/person/workitems/get

/**
 * Scrapes all workorders that are checked on the current listing and copy's to the clipboard in my spreadsheet's format.
 */
function scrapeCheckedAndCopy() {
  const selectedRows = document.querySelectorAll(
    "[ux-id='ticket-console-grid-list'] .ngViewport [ng-row].ngRow.selected"
  )
  // Assert that we are on the correct page and have selected an item.
  if (
    window.location.href !=
      'https://ebay-smartit.onbmc.com/smartit/app/#/ticket-console' ||
    selectedRows.length === 0
  ) {
    console.log('wrong page')
    let title = 'Error!'
    let body =
      'Please ensure you are on a listing page and have selected at least one item.'
    notify({ title, SUCCESS_ICON, body })
    return
  }
  const workorders = getWorkOrdersFromSelected(selectedRows)

    fetch("https://ebay-smartit.onbmc.com/smartit/rest/v2/person/workitems/get", {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,enq=0.9",
        "cache-control": "no-cache",
        "content-type": "application/jsoncharset=UTF-8",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Google Chrome\"v=\"107\", \"Chromium\"v=\"107\", \"Not=A?Brand\"v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-xsrf-token": "189b8q5j2cecuvpgfqo9jqb2a31vrvs53ijtjsdtg3nes0gs0b6b"
      },
      "referrer": "https://ebay-smartit.onbmc.com/",
      "referrerPolicy": "origin",
      "body": "{\"filterCriteria\":{\"ticketSpecificStatuses\":[\"Assigned\"],\"assignees\":[{\"loginId\":\"mhixon\"}]},\"chunkInfo\":{\"startIndex\":0,\"chunkSize\":75},\"sortInfo\":{},\"attributeNames\":[\"priority\",\"id\",\"slaStatus\",\"customerName\",\"assignee\",\"summary\",\"status\",\"actualStartDate\",\"submitDate\",\"lastModifiedDate\",\"customerSite\",\"needsAttention\"],\"customAttributeNames\":[]}",
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    })

  // Promise.allSettled()
  //   .then((results) => {

  // })
}

function getWorkOrdersFromSelected(selectedRows) {
  const headerHTML = document.querySelector(
    '#main > div > div.tc__panel > div.tc__list.ng-scope > div > div.ngTopPanel.ng-scope .ngHeaderContainer .ngHeaderScroller'
  )
  const headers = parseColumnHeaders(headerHTML)
  let displayId_idx = headers.indexOf('Display Id')
  console.log({ headers, displayId_idx })

  let workorders = []
  for (let item of selectedRows) {
    workorders.push(
      item.querySelectorAll('span.ng-binding')[displayId_idx - 1].innerText
    )
  }
  console.log({ workorders })
  return workorders
}

/**
 * Returns an array of the column headers
 */
function parseColumnHeaders(container) {
  const headers = []
  for (let inner of container.children) {
    if (inner === container.children[0]) {
      //headers.push("checkbox")
    } else {
      headers.push(inner.querySelector('[ux-id="column-header"]').innerText)
    }
  }
  return headers
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