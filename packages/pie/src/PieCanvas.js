/*
 * This file is part of the nivo project.
 *
 * Copyright 2016-present, Raphaël Benitte.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import React, { useEffect, useRef } from 'react'
import { useDimensions, useTheme, withContainer } from '@nivo/core'
import { renderLegendToCanvas } from '@nivo/legends'
import { useInheritedColor } from '@nivo/colors'
import { PieSvgDefaultProps, PieSvgPropTypes } from './props'
import { useNormalizedData, usePieFromBox, usePieSliceLabels } from './hooks'
import { drawSliceLabels } from './canvas'

const PieCanvas = ({
    data,
    id,
    value,
    valueFormat,
    width,
    height,
    margin: partialMargin,
    pixelRatio,
    sortByValue,
    startAngle,
    endAngle,
    fit,
    padAngle,
    innerRadius: innerRadiusRatio,
    cornerRadius,
    colors,
    borderColor,
    borderWidth,

    // slices labels
    sliceLabel,
    enableSliceLabels,
    sliceLabelsSkipAngle,
    sliceLabelsTextColor,
    sliceLabelsRadiusOffset,

    legends,
    isInteractive,
}) => {
    const canvasEl = useRef(null)
    const theme = useTheme()

    const { margin, innerWidth, innerHeight, outerWidth, outerHeight } = useDimensions(
        width,
        height,
        partialMargin
    )

    const normalizedData = useNormalizedData({
        data,
        id,
        value,
        valueFormat,
        colors,
    })

    const { dataWithArc, arcGenerator, centerX, centerY, radius, innerRadius } = usePieFromBox({
        data: normalizedData,
        width: innerWidth,
        height: innerHeight,
        fit,
        innerRadius: innerRadiusRatio,
        startAngle,
        endAngle,
        padAngle,
        sortByValue,
        cornerRadius,
    })

    const getBorderColor = useInheritedColor(borderColor, theme)

    const sliceLabels = usePieSliceLabels({
        enable: enableSliceLabels,
        dataWithArc,
        label: sliceLabel,
        radius,
        innerRadius,
        radiusOffset: sliceLabelsRadiusOffset,
        skipAngle: sliceLabelsSkipAngle,
        textColor: sliceLabelsTextColor,
    })

    useEffect(() => {
        canvasEl.current.width = outerWidth * pixelRatio
        canvasEl.current.height = outerHeight * pixelRatio

        const ctx = canvasEl.current.getContext('2d')

        ctx.scale(pixelRatio, pixelRatio)

        ctx.fillStyle = theme.background
        ctx.fillRect(0, 0, outerWidth, outerHeight)

        ctx.save()
        ctx.translate(margin.left, margin.top)

        arcGenerator.context(ctx)

        ctx.save()
        ctx.translate(centerX, centerY)

        dataWithArc.forEach(arc => {
            ctx.beginPath()
            ctx.fillStyle = arc.color

            ctx.strokeStyle = getBorderColor(arc)
            ctx.lineWidth = borderWidth

            arcGenerator(arc.arc)

            ctx.fill()

            if (borderWidth > 0) {
                ctx.stroke()
            }
        })

        if (enableSliceLabels === true) {
            drawSliceLabels(ctx, sliceLabels, theme)
        }

        // legends assume a box rather than a center,
        // that's why we restore previously saved position here.
        ctx.restore()
        legends.forEach(legend => {
            renderLegendToCanvas(ctx, {
                ...legend,
                data: dataWithArc,
                containerWidth: innerWidth,
                containerHeight: innerHeight,
                theme,
            })
        })
    }, [
        canvasEl,
        innerWidth,
        innerHeight,
        outerWidth,
        outerHeight,
        margin.top,
        margin.left,
        pixelRatio,
        centerX,
        centerY,
        arcGenerator,
        dataWithArc,
        getBorderColor,
        sliceLabels,
        legends,
        theme,
    ])

    return (
        <canvas
            ref={canvasEl}
            width={outerWidth * pixelRatio}
            height={outerHeight * pixelRatio}
            style={{
                width: outerWidth,
                height: outerHeight,
                cursor: isInteractive ? 'auto' : 'normal',
            }}
            //onMouseEnter={isInteractive ? handleMouseHover : undefined}
            //onMouseMove={isInteractive ? handleMouseHover : undefined}
            //onMouseLeave={isInteractive ? handleMouseLeave : undefined}
            //onClick={isInteractive ? handleClick : undefined}
        />
    )
}

PieCanvas.displayName = 'PieCanvas'
PieCanvas.propTypes = PieSvgPropTypes
PieCanvas.defaultProps = PieSvgDefaultProps

export default withContainer(PieCanvas)
