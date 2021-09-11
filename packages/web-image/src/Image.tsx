import type { Property } from 'csstype';
import * as React from 'react';
import {
  ColorValue,
  ImageProps as BaseImageProps,
  ImageResizeMode,
  ImageStyle,
  ImageURISource as BaseImageURISource,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

export interface ResponsiveImageSource {
  /**
   * A list of one or more strings separated by commas indicating a set of possible images represented by the source for the browser to use.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-srcset
   */
  readonly srcSet: string;
  /**
   * The MIME media type of the resource, optionally with a codecs parameter.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-type
   */
  readonly type: string;
  /**
   * Media query of the resource's intended media.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-media
   */
  readonly media?: string | null;
}

export interface ImageURISource extends BaseImageURISource {
  /**
   * Responsive image sources.
   */
  sources?: readonly ResponsiveImageSource[] | null;
}

export type ImageSourcePropType =
  | ImageURISource
  | readonly ImageURISource[]
  | number;

const interopDefault = (source: any): ImageURISource =>
  typeof source.default === 'object' ? source.default : source;

const resolveSource = (
  source: ImageSourcePropType,
): {
  uri: string | undefined;
  sources: readonly ResponsiveImageSource[] | null | undefined;
  width: number | undefined;
  height: number | undefined;
} => {
  if (source == null || typeof source === 'string') {
    return {
      uri: source,
      sources: undefined,
      width: undefined,
      height: undefined,
    };
  } else if (typeof source === 'object') {
    const sourceObject = interopDefault(source);
    const width =
      typeof sourceObject.width === 'number' ? sourceObject.width : undefined;
    const height =
      typeof sourceObject.height === 'number' ? sourceObject.height : undefined;
    return {
      uri: sourceObject.uri,
      sources: sourceObject.sources,
      width,
      height,
    };
  } else {
    return {
      uri: undefined,
      sources: undefined,
      width: undefined,
      height: undefined,
    };
  }
};

const resizeModeToObjectFit = (
  resizeMode: ImageResizeMode,
): Property.ObjectFit => {
  switch (resizeMode) {
    case 'cover':
      return 'cover';
    case 'contain':
      return 'contain';
    case 'stretch':
      return 'fill';
    case 'center':
      return 'none';
    default:
      throw new Error('Unsupported resize mode: ' + resizeMode);
  }
};

let _filterId = 0;

// https://github.com/necolas/react-native-web/blob/master/packages/react-native-web/src/exports/Image/index.js
const createTintColorSVG = (
  tintColor: ColorValue | undefined,
  id: number | null | undefined,
) => {
  return tintColor != null && id != null ? (
    <svg
      style={{
        position: 'absolute',
        height: 0,
        visibility: 'hidden',
        width: 0,
      }}
    >
      <defs>
        {/* @ts-expect-error */}
        <filter id={`tint-${id}`} suppressHydrationWarning={true}>
          <feFlood
            floodColor={`${tintColor as string}`}
            key={tintColor as string}
          />
          <feComposite in2="SourceAlpha" operator="atop" />
        </filter>
      </defs>
    </svg>
  ) : null;
};

const getFlatStyle = (
  style: StyleProp<ImageStyle> | null | undefined,
  blurRadius: number | null | undefined,
  propsTintColor: ColorValue | undefined,
  filterId: number | null | undefined,
): [
  ViewStyle,
  ImageStyle['resizeMode'],
  Property.Filter | undefined,
  ColorValue | undefined,
] => {
  const flatStyle = { ...StyleSheet.flatten(style) };
  const { filter, resizeMode } = flatStyle as any;
  const tintColor = flatStyle.tintColor ?? propsTintColor;

  // Add CSS filters
  // React Native exposes these features as props and proprietary styles
  const filters: string[] = [];
  let _filter: string | undefined;

  if (filter) {
    filters.push(filter);
  }
  if (blurRadius) {
    filters.push(`blur(${blurRadius}px)`);
  }
  if (tintColor && filterId != null) {
    filters.push(`url(#tint-${filterId})`);
  }

  if (filters.length > 0) {
    _filter = filters.join(' ');
  }

  // These styles are converted to CSS filters applied to the
  // element displaying the background image.
  delete flatStyle.tintColor;
  // These styles are not supported on View
  delete flatStyle.overlayColor;
  delete flatStyle.resizeMode;

  return [flatStyle, resizeMode, _filter, tintColor];
};

export interface ImageProps extends Omit<BaseImageProps, 'source'> {
  /**
   * If the image should not be lazy loaded.
   *
   * @platform web
   */
  critical?: boolean;
  /**
   * If the image is draggable.
   *
   * @platform web
   */
  draggable?: boolean;
  source: ImageSourcePropType;
  tintColor?: ColorValue;
}

export const Image = React.forwardRef<View, ImageProps>(
  (
    {
      source,
      resizeMode: propsResizeMode,
      accessibilityLabel,
      width,
      height,
      critical,
      style,
      draggable,
      tintColor: propsTintColor,
      blurRadius,
      fadeDuration = 300,
      onLoadEnd,
      ...others
    },
    ref,
  ) => {
    const filterRef = React.useRef(_filterId++);
    const resolvedSource = resolveSource(source);
    const [flatStyle, _resizeMode, filter, tintColor] = getFlatStyle(
      style,
      blurRadius,
      propsTintColor,
      filterRef.current,
    );
    const resizeMode = propsResizeMode ?? _resizeMode;

    const [loaded, setLoaded] = React.useState<boolean | null>(
      fadeDuration === 0 ? true : null,
    );

    // Avoid fade effect if the image is cached or loaded very fast
    // using arbitrary 50ms. There doesn't seem to be a way to know
    // when an image starts loading using the dom api and loading="lazy"
    // so just assume it starts when the component mounts, which is true
    // for images initially on screen. For the other ones fading them in
    // as they come on streen should always be a desired effect.
    const timeoutRef = React.useRef<any>(null);
    React.useEffect(() => {
      if (fadeDuration !== 0) {
        timeoutRef.current = setTimeout(() => {
          setLoaded(false);
        }, 50);
      }
      return () => {
        clearTimeout(timeoutRef.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onLoad = () => {
      clearTimeout(timeoutRef.current);
      setLoaded(true);
      onLoadEnd?.();
    };

    return (
      <View
        ref={ref}
        style={[
          {
            overflow: 'hidden',
            width:
              width === undefined && resolvedSource.width != null
                ? resolvedSource.width
                : width,
            height,
          },
          flatStyle,
        ]}
        {...others}
      >
        {resolvedSource.width != null && resolvedSource.height != null && (
          <div
            style={{
              paddingTop: `${
                (resolvedSource.height / resolvedSource.width) * 100
              }%`,
            }}
          />
        )}
        {source != null && (
          <picture
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            {resolvedSource.sources?.map((s: any, i: number) => (
              <source
                key={i}
                srcSet={s.srcSet}
                media={s.media}
                sizes={s.sizes}
                type={s.type}
              />
            ))}
            <img
              style={{
                width: '100%',
                height: '100%',
                filter,
                objectFit: resizeModeToObjectFit(
                  resizeMode ??
                    // When using intrinsic size use contain to avoid
                    // rounding errors causing some pixel lost.
                    (resolvedSource.width != null && width == null
                      ? 'contain'
                      : 'cover'),
                ),
                opacity: loaded === false ? 0 : 1,
                transition:
                  loaded != null && fadeDuration !== 0
                    ? `opacity ${fadeDuration}ms linear`
                    : undefined,
              }}
              src={resolvedSource.uri}
              loading={critical ? 'eager' : 'lazy'}
              alt={accessibilityLabel}
              width={resolvedSource.width}
              height={resolvedSource.height}
              draggable={draggable}
              onLoad={onLoad}
            />
          </picture>
        )}
        {createTintColorSVG(tintColor, filterRef.current)}
      </View>
    );
  },
);
