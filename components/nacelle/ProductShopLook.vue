<template>
  <div class="shop-look nacelle">
    <nuxt-img :src="imageSrc" alt="" @click="toggleProductCard" />
    <button class="button is-primary" @click="toggleProductCard">
      {{ buttonText }}
    </button>
    <transition name="fade">
      <div v-if="productVisible" class="shop-look-modal">
        <div class="shop-look-modal-inner">
          <div
            v-for="product in products"
            :key="product.id"
            class="shop-look-product"
          >
            <slot name="product-card" :product="product">
              <product-card :product="product" />
            </slot>
          </div>
          <interface-close-button class="close" @close="toggleProductCard" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  props: {
    imageSrc: {
      type: String,
      default: '',
      required: true
    },
    products: {
      type: Array,
      required: true
    },
    buttonText: {
      type: String,
      default: 'Shop the look'
    }
  },
  data() {
    return {
      productVisible: false
    }
  },
  mounted() {
    this.$emit('ready', this.$el)
  },
  methods: {
    toggleProductCard() {
      this.productVisible = !this.productVisible
    }
  }
}
</script>

<style lang="scss" scoped>
.shop-look {
  position: relative;
  overflow: hidden;
  border: 1px solid #f5f5f5;
}

img {
  display: block;
  width: 100%;
}

.button {
  position: absolute;
  bottom: 1rem;
  left: 1rem;

  &.is-primary {
    letter-spacing: 1px;
    border-radius: 0;
    border: 0;
    outline: 0;
    box-shadow: none;
    background-color: #3b3b3b;
    color: #fff;
  }
}

.shop-look-modal {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  padding: 2rem;
  padding-top: 6rem;
  width: 100%;
  background-color: rgba(#000, 0.7);
  overflow: scroll;
  z-index: 998;

  @media screen and (min-width: 769px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 0.87rem;
}

.shop-look-modal-inner {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  margin: 0 auto;
  padding: 1rem;
  max-width: 800px;
  background-color: #ffffff;
}

.shop-look-product {
  margin: 0 auto;
  max-width: 330px;
}

.fade-enter-active {
  transition: opacity 0.25s;
}

.fade-enter {
  opacity: 0;
}
</style>
