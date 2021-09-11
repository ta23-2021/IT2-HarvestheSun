import ctEvents from 'ct-events'
import { getCurrentScreen } from 'blocksy-frontend'

import { computeShrink } from './sticky/shrink'
import { computeAutoHide } from './sticky/auto-hide'
import { computeFadeSlide } from './sticky/fade-slide'

export const setTransparencyFor = (deviceContainer, value = 'yes') => {
	Array.from(
		deviceContainer.querySelectorAll('[data-row][data-transparent-row]')
	).map((el) => {
		el.dataset.transparentRow = value
	})
}

const getStartPositionFor = (stickyContainer) => {
	if (
		stickyContainer.dataset.sticky.indexOf('shrink') === -1 &&
		stickyContainer.dataset.sticky.indexOf('auto-hide') === -1
	) {
		return stickyContainer.parentNode.getBoundingClientRect().height + 200
	}

	const stickyOffset =
		stickyContainer.closest('header').getBoundingClientRect().top + scrollY

	const row = stickyContainer.parentNode

	if (
		row.parentNode.children.length === 1 ||
		row.parentNode.children[0].classList.contains('ct-sticky-container')
	) {
		return stickyOffset
	}

	return Array.from(row.parentNode.children)
		.reduce((result, el, index) => {
			if (result.indexOf(0) > -1 || !el.dataset.row) {
				return [...result, 0]
			} else {
				return [
					...result,

					el.classList.contains('ct-sticky-container')
						? 0
						: el.getBoundingClientRect().height,
				]
			}
		}, [])
		.reduce((sum, height) => sum + height, stickyOffset)
}

let prevScrollY = null

const compute = () => {
	if (prevScrollY === scrollY) {
		requestAnimationFrame(() => {
			compute()
		})

		return
	}

	prevScrollY = scrollY

	const stickyContainer = document.querySelector(
		`[data-device="${getCurrentScreen()}"] [data-sticky]`
	)

	if (!stickyContainer) {
		return
	}

	const startPosition = getStartPositionFor(stickyContainer)

	const isSticky =
		(startPosition > 0 && Math.abs(window.scrollY - startPosition) < 5) ||
		window.scrollY > startPosition

	if (isSticky && document.body.dataset.header.indexOf('shrink') === -1) {
		document.body.dataset.header = `${document.body.dataset.header}:shrink`
	}

	if (!isSticky && document.body.dataset.header.indexOf('shrink') > -1) {
		document.body.dataset.header = document.body.dataset.header.replace(
			':shrink',
			''
		)
	}

	const stickyComponents = stickyContainer.dataset.sticky
		.split(':')
		.filter((c) => c !== 'yes' && c !== 'no' && c !== 'fixed')

	if (stickyComponents.indexOf('shrink') > -1) {
		computeShrink({
			stickyContainer,
			isSticky,
			startPosition,
			stickyComponents,
		})
	}

	if (stickyComponents.indexOf('auto-hide') > -1) {
		computeAutoHide({
			stickyContainer,
			isSticky,
			startPosition,
			stickyComponents,
		})
	}

	if (
		stickyComponents.indexOf('slide') > -1 ||
		stickyComponents.indexOf('fade') > -1
	) {
		computeFadeSlide({
			stickyContainer,
			isSticky,
			startPosition,
			stickyComponents,
		})
	}

	requestAnimationFrame(() => {
		compute()
	})
}

export const mountStickyHeader = () => {
	if (!document.querySelector('header [data-sticky]')) {
		return
	}

	compute()
}
