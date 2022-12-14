import { get, set, del } from 'idb-keyval'
import { v4 as uuid } from 'uuid'
import { itemPrice } from './../helpers/product'

export const state = () => ({
  lineItems: [],
  cartVisible: false,
  freeShippingThreshold: null,
  error: null
})
export const getters = {
  quantityTotal(state) {
    if (state.lineItems.length >= 1) {
      return state.lineItems.reduce((acc, item) => acc + item.quantity, 0)
    }

    return 0
  },

  cartSubtotal(state) {
    if (state.lineItems.length >= 1) {
      return state.lineItems.reduce((acc, item) => {
        const metadata = item.metadata
        const price = itemPrice(item, metadata)
        acc += parseFloat(price)
        return acc
      }, 0)
    }

    return 0
  },

  freeShippingThreshold(state) {
    return state.freeShippingThreshold
  },

  freeShippingThresholdPassed(state, getters) {
    if (
      getters.cartSubtotal &&
      state.freeShippingThreshold &&
      getters.cartSubtotal > state.freeShippingThreshold
    ) {
      return true
    } else {
      return false
    }
  },

  amountUntilFreeShipping(state, getters) {
    if (getters.cartSubtotal != null && state.freeShippingThreshold) {
      return state.freeShippingThreshold - getters.cartSubtotal
    }
  },

  checkoutLineItems(state) {
    if (state.lineItems.length > 0) {
      return state.lineItems.map((lineItem) => ({
        cartItemId: lineItem.id,
        variantId: lineItem.variant.id,
        quantity: lineItem.quantity,
        metafields: lineItem.metafields
      }))
    } else {
      return []
    }
  }
}

export const mutations = {
  addLineItemMutation(state, payload) {
    const index = state.lineItems.findIndex((lineItem) => {
      if (lineItem.variant.id === payload.variant.id) {
        return (
          JSON.stringify(payload.metafields) ===
          JSON.stringify(lineItem.metafields)
        ) // match only if metafields are the same.
      }

      return false
    })
    if (index === -1) {
      // generate unique id for line
      payload.id = `${payload.variant.id}::${uuid()}`
      state.lineItems.push(payload)
    } else {
      state.lineItems[index].quantity += payload.quantity
    }
  },

  removeLineItemMutation(state, payload) {
    const index = state.lineItems.findIndex(
      (lineItem) => lineItem.variant.id === payload
    )
    state.lineItems.splice(index, 1)
  },

  updateLineItemMutation(state, payload) {
    const index = state.lineItems.findIndex(
      (lineItem) => lineItem.variant.id === payload.variant.id
    )
    if (index > -1) {
      const currentItem = state.lineItems[index]
      state.lineItems.splice(index, 1, { ...currentItem, ...payload })
    }
  },

  incrementLineItemMutation(state, payload) {
    const index = state.lineItems.findIndex(
      (lineItem) => lineItem.id === payload
    )
    if (index !== -1) {
      const item = state.lineItems[index]
      if (item.quantity === 6) return
      state.lineItems[index].quantity++
    }
  },

  decrementLineItemMutation(state, payload) {
    const index = state.lineItems.findIndex(
      (lineItem) => lineItem.id === payload
    )
    if (index !== -1 && state.lineItems[index].quantity >= 1) {
      state.lineItems[index].quantity--
      if (state.lineItems[index].quantity === 0) {
        state.lineItems.splice(index, 1)
      }
    }
  },

  setLineItems(state, payload) {
    state.lineItems.splice(0)
    state.lineItems = payload
  },

  showCart(state) {
    state.cartVisible = true
  },

  hideCart(state) {
    state.cartVisible = false
  },

  toggleCart(state) {
    state.cartVisible = !state.cartVisible
  },

  setFreeShippingThreshold(state, payload) {
    state.freeShippingThreshold = payload
  },

  setCartError(state, error) {
    state.error = error
  }
}

export const actions = {
  addLineItem({ state, rootState, commit, dispatch }, payload) {
    commit('addLineItemMutation', payload)
    dispatch('saveLineItems', state.lineItems)

    if (rootState.events) {
      dispatch(
        'events/addToCart',
        {
          product: payload,
          cart: state.lineItems
        },
        { root: true }
      )
    }

    if (rootState.product.recommendations) {
      dispatch('product/recommendations/removeProduct', payload.handle, {
        root: true
      })
    }
  },

  removeLineItem({ state, rootState, dispatch, commit }, payload) {
    const lineItem = state.lineItems.find((item) => item.variant.id === payload)
    if (rootState.events) {
      dispatch(
        'events/removeFromCart',
        {
          product: lineItem,
          cart: state.lineItems
        },
        { root: true }
      )
    }

    if (rootState.product.recommendations && lineItem.handle) {
      dispatch('product/recommendations/addProduct', lineItem.handle, {
        root: true
      })
    }

    commit('removeLineItemMutation', payload)
    dispatch('saveLineItems', state.lineItems)
  },

  incrementLineItem({ state, commit, dispatch }, payload) {
    commit('incrementLineItemMutation', payload)
    dispatch('saveLineItems', state.lineItems)
  },

  decrementLineItem({ state, commit, dispatch }, payload) {
    commit('decrementLineItemMutation', payload)
    dispatch('saveLineItems', state.lineItems)
  },

  updateLineItem({ state, commit, dispatch }, payload) {
    commit('updateLineItemMutation', payload)
    dispatch('saveLineItems', state.lineItems)
  },

  saveLineItems({ state }) {
    set('line-items', state.lineItems)
  },

  async resetLineItems({ commit }) {
    await del('line-items')
    commit('setLineItems', [])
  },

  async initializeCart({ commit }) {
    const lineItems = await get('line-items')
    commit('setLineItems', lineItems || [])
    commit('setFreeShippingThreshold', 25)
    commit('hideCart')
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
