import _ from 'lodash'
import {jsonHeader, handleErr} from 'ringcentral-embeddable-extension-common/src/common/fetch'
import * as ls from 'ringcentral-embeddable-extension-common/src/common/ls'

export function getCSRFToken() {
  return _.get(
    document.cookie.match(/hubspotapi-csrf=([^=;]+);/),
    '[1]'
  )
}


export function getPortalId() {
  return _.get(
    document.cookie.match(/hubspot\.hub\.id=([^=;]+);/),
    '[1]'
  )
}

export const lsKeys = {
  accessTokenLSKey: 'third-party-access-token'
}

export const rc = {
  local: {
    accessToken: null
  },
  postMessage: data => {
    document.querySelector('#rc-widget-adapter-frame')
      .contentWindow
      .postMessage(data, '*')
  },
  currentUserId: '',
  rcLogined: false,
  cacheKey: 'contacts' + '_' + '',
  updateToken: async (newToken, type = 'accessToken') => {
    if (!newToken){
      await ls.clear()
      rc.local = {
        accessToken: null
      }
    } else if (_.isString(newToken)) {
      rc.local[type] = newToken
      let key = lsKeys[`${type}LSKey`]
      await ls.set(key, newToken)
    } else {
      Object.assign(rc.local, newToken)
      let ext = Object.keys(newToken)
        .reduce((prev, key) => {
          prev[lsKeys[`${key}LSKey`]] = newToken[key]
          return prev
        }, {})
      await ls.set(ext)
    }
  }
}

export const commonFetchOptions = (headers) => ({
  headers: headers || {
    ...jsonHeader,
    'X-HubSpot-CSRF-hubspotapi': getCSRFToken()
  },
  handleErr: (res) => {
    let {status} = res
    if (status === 401) {
      rc.updateToken(null)
    }
    if (status > 304) {
      handleErr(res)
    }
  }
})

export function getIds(href = location.href) {
  let reg = /contacts\/(\d+)\/contact\/(\d+)/
  let arr = href.match(reg) || []
  let portalId = arr[1]
  let vid = arr[2]
  if (!portalId || !vid) {
    return null
  }
  return {
    portalId,
    vid
  }
}
