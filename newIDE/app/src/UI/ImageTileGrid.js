// @flow
import * as React from 'react';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import { Column, Line } from './Grid';
import {
  useResponsiveWindowSize,
  type WindowSizeType,
} from './Responsive/ResponsiveWindowMeasurer';
import { CorsAwareImage } from './CorsAwareImage';
import Text from './Text';
import Skeleton from '@material-ui/lab/Skeleton';
import Typography from '@material-ui/core/Typography';
import { shortenString } from '../Utils/StringHelpers';
import useForceUpdate from '../Utils/UseForceUpdate';
import { useIsMounted } from '../Utils/UseIsMounted';
import Lock from '../UI/CustomSvgIcons/Lock';
import {
  CardWidget,
  LARGE_WIDGET_SIZE,
} from '../MainFrame/EditorContainers/HomePage/CardWidget';
import { ColumnStackLayout } from './Layout';
import Chip from './Chip';

const SPACING = 5;

const styles = {
  buttonStyle: {
    textAlign: 'left',
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  overlay: {
    position: 'absolute',
    background: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    padding: '2px 6px',
  },
  overlayText: {
    color: 'white', // Same color for all themes.
    marginTop: 0,
    marginBottom: 0,
  },
  thumbnailImageWithDescription: {
    display: 'block', // Display as a block to prevent cumulative layout shift.
    objectFit: 'contain',
    verticalAlign: 'middle',
    width: '100%',
    borderRadius: 8,
    border: '1px solid lightgrey',
    boxSizing: 'border-box', // Take border in account for sizing to avoid cumulative layout shift.
    // Prevent cumulative layout shift by enforcing
    // the 16:9 ratio.
    aspectRatio: '16 / 9',
    transition: 'opacity 0.3s ease-in-out',
  },
  dataLoadingSkeleton: {
    // Display a skeleton with the same aspect and border as the images:
    borderRadius: 8,
    aspectRatio: '16 / 9',
  },
  imageLoadingSkeleton: {
    // Display a skeleton with the same aspect and border as the images,
    // and with absolute positioning so that it stays behind the image (until it's loaded).
    position: 'absolute',
    borderRadius: 8,
    aspectRatio: '16 / 9',
  },
  lockerImage: { height: 80, width: 80 },
  lockedOverlay: {
    position: 'absolute',
    background: 'rgba(0, 0, 0, 0.6)',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '8px 16px',
  },
  chip: {
    height: 24,
  },
};

type OverlayTextPosition =
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight';

const ImageOverlay = ({
  content,
  position,
}: {|
  content: React.Node,
  position: OverlayTextPosition,
|}) => {
  const positionStyles = {
    top: position === 'topLeft' || position === 'topRight' ? 8 : undefined,
    bottom:
      position === 'bottomLeft' || position === 'bottomRight' ? 8 : undefined,
    left: position === 'topLeft' || position === 'bottomLeft' ? 8 : undefined,
    right:
      position === 'topRight' || position === 'bottomRight' ? 8 : undefined,
  };
  return (
    <div
      style={{
        ...styles.overlay,
        ...positionStyles,
      }}
    >
      <Typography variant="body1" style={styles.overlayText}>
        {content}
      </Typography>
    </div>
  );
};

const LockedOverlay = () => (
  <div style={styles.lockedOverlay}>
    <Lock style={styles.lockerImage} />
  </div>
);

export type ImageTileComponent = {|
  onClick: () => void,
  imageUrl: string,
  title?: string,
  isLocked?: boolean,
  description?: string,
  overlayText?: string | React.Node,
  overlayTextPosition?: OverlayTextPosition,
  chipText?: string | null,
  chipColor?: string | null, // Color for the chip border.
|};

type ImageTileGridProps = {|
  items: Array<ImageTileComponent>,
  isLoading?: boolean,
  getColumnsFromWindowSize: (
    windowSize: WindowSizeType,
    isLandscape: boolean
  ) => number,
  getLimitFromWindowSize?: (
    windowSize: WindowSizeType,
    isLandscape: boolean
  ) => number,
|};

const ImageTileGrid = ({
  items,
  isLoading,
  getColumnsFromWindowSize,
  getLimitFromWindowSize,
}: ImageTileGridProps) => {
  const { windowSize, isLandscape } = useResponsiveWindowSize();
  const MAX_COLUMNS = getColumnsFromWindowSize('xlarge', isLandscape);
  const limit = getLimitFromWindowSize
    ? getLimitFromWindowSize(windowSize, isLandscape)
    : undefined;
  const itemsToDisplay = limit ? items.slice(0, limit) : items;
  const forceUpdate = useForceUpdate();
  const isMounted = useIsMounted();

  const loadedImageUrls = React.useRef<Set<string>>(new Set<string>());
  const setImageLoaded = React.useCallback(
    (loadedImageUrl: string) => {
      // Give a bit of time to an image to fully render before revealing it.
      setTimeout(() => {
        if (!isMounted) return; // Avoid warnings if the component was removed in the meantime.

        loadedImageUrls.current.add(loadedImageUrl);
        forceUpdate();
      }, 50);
    },
    [forceUpdate, isMounted]
  );

  const columns = getColumnsFromWindowSize(windowSize, isLandscape);

  return (
    <Line noMargin>
      <GridList
        cols={columns}
        style={{
          flex: 1,
          maxWidth: (LARGE_WIDGET_SIZE + 2 * SPACING) * MAX_COLUMNS, // Avoid tiles taking too much space on large screens.
        }}
        cellHeight="auto"
        spacing={SPACING * 2}
      >
        {isLoading
          ? new Array(columns).fill(0).map((_, index) => (
              // Display tiles but with skeletons while the data is loading.
              <GridListTile key={index}>
                <Skeleton
                  variant="rect"
                  width="100%"
                  height="100%"
                  style={styles.dataLoadingSkeleton}
                />
              </GridListTile>
            ))
          : itemsToDisplay.map((item, index) => (
              <GridListTile key={index}>
                <CardWidget onClick={item.onClick} size="large">
                  <Column expand noMargin>
                    <div style={styles.imageContainer}>
                      {!loadedImageUrls.current.has(item.imageUrl) ? (
                        // Display a skeleton behind the image while it's loading.
                        <Skeleton
                          variant="rect"
                          width="100%"
                          height="100%"
                          style={styles.imageLoadingSkeleton}
                        />
                      ) : null}
                      <CorsAwareImage
                        style={{
                          // Once ready, animate the image display.
                          opacity: loadedImageUrls.current.has(item.imageUrl)
                            ? 1
                            : 0,
                          ...styles.thumbnailImageWithDescription,
                        }}
                        src={item.imageUrl}
                        alt={`thumbnail ${index}`}
                        onLoad={() => setImageLoaded(item.imageUrl)}
                      />
                      {item.overlayText && (
                        <ImageOverlay
                          content={item.overlayText}
                          position={item.overlayTextPosition || 'bottomRight'}
                        />
                      )}
                      {item.isLocked && <LockedOverlay />}
                    </div>
                    <div style={styles.textContainer}>
                      <ColumnStackLayout
                        noMargin
                        expand
                        justifyContent="space-between"
                        useFullHeight
                        noOverflowParent
                      >
                        <ColumnStackLayout
                          noMargin
                          expand
                          justifyContent="flex-start"
                          useFullHeight
                          noOverflowParent
                        >
                          {item.title && (
                            <Text size="sub-title" noMargin align="left">
                              {item.title}
                            </Text>
                          )}
                          {item.description && (
                            <Text
                              size="body"
                              color="secondary"
                              noMargin
                              align="left"
                            >
                              {shortenString(item.description, 115)}
                            </Text>
                          )}
                        </ColumnStackLayout>
                        {item.chipText && (
                          <Line
                            justifyContent="space-between"
                            alignItems="flex-end"
                          >
                            <Chip
                              style={{
                                ...styles.chip,
                                border: `1px solid ${item.chipColor ||
                                  '#3BF7F4'}`,
                              }}
                              label={item.chipText}
                              variant="outlined"
                            />
                          </Line>
                        )}
                      </ColumnStackLayout>
                    </div>
                  </Column>
                </CardWidget>
              </GridListTile>
            ))}
      </GridList>
    </Line>
  );
};

export default ImageTileGrid;
